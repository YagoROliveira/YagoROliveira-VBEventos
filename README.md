# VB Eventos

Plataforma de gestão de eventos (backend + frontend) pronta para rodar localmente e com caminho claro para Kubernetes.

Uma API Node/Fastify persiste eventos e participantes no Postgres via Prisma. O frontend React lista, cria, edita e inscreve pessoas, respeitando o limite de vagas. IDs sequenciais nunca saem do banco: a API devolve Sqids.

## Por que esta stack

- **Node + TypeScript + Fastify** — runtime conhecido, tipagem e servidor leve com hooks nativos para health, métricas e logs.
- **Prisma + Postgres** — schema-first, client tipado e migrations oficiais. TypeORM resolveria o mesmo problema, mas com mais mágica de runtime e tipos mais frouxos em QueryBuilder. Neste tamanho de domínio (2 models + transação de vagas), Prisma entrega mais clareza. Se um filtro derivado ficar complexo, o repositório já usa SQL explícito (`$queryRaw`) em vez de forçar o client.
- **Sqids** — ofusca o inteiro do banco num id público estável. Detalhe abaixo.
- **React + Vite + Zustand + TanStack Query + shadcn** — UI rápida de montar. Filtros e modo de visualização ficam na URL; Query guarda server state.
- **Prometheus + Loki + Grafana + Alloy** — observabilidade sobe no mesmo `docker compose up`. Sem passo extra.

## O que a aplicação faz

- CRUD de eventos: nome, descrição, data/hora, local, capacidade.
- Inscrição de participantes por evento, com trava `SELECT ... FOR UPDATE` para não estourar vagas (409 `EVENT_FULL`). A mesma trava vale na alteração de capacidade: não dá para cair abaixo do número de inscritos, mesmo com requests em paralelo (400 `CAPACITY_TOO_LOW`).
- Filtro de eventos por data (`from`/`to`) e status derivado: `upcoming`, `past`, `full`.
- Paginação padrão de 20 itens (máx. 50) em eventos e participantes.
- Health checks: `/healthz` (liveness) e `/readyz` (Postgres).
- Métricas em `/metrics` e logs JSON estruturados.

## Telas e rotas

3 telas de produto, 4 rotas (create/edit compartilham o formulário):

| Tela | Rota |
| --- | --- |
| Listagem | `/` → `/events` |
| Novo evento | `/events/new` |
| Detalhe + inscrição | `/events/:id` |
| Editar evento | `/events/:id/edit` |

## Como rodar com Docker

Requisito: Docker + Compose.

```bash
cp .env.example .env
docker compose up --build
```

Sobe de uma vez: API, frontend, Postgres, Prometheus, Loki, Grafana e Alloy.

| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:8081 |
| API | http://localhost:3002 |
| Health | http://localhost:3002/healthz |
| Ready | http://localhost:3002/readyz |
| Métricas | http://localhost:3002/metrics |
| Grafana | http://localhost:3001 (admin/admin) |
| Prometheus | http://localhost:9090 |
| Loki | http://localhost:3100 |

Para popular dados de exemplo:

```bash
docker compose exec api npx prisma db seed
```

O seed precisa de `tsx` no container. Se o comando falhar na imagem de produção (deps de desenvolvimento omitidas), rode o seed no fluxo local abaixo.

## Como rodar sem Docker

Postgres precisa estar acessível em `DATABASE_URL`.

```bash
cp .env.example .env

cd api
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev

cd ../web
npm install
npm run dev
```

Frontend em http://localhost:5173 (proxy `/api` → API na 3000).

## Testes

```bash
cd api && npm run lint && npm test
cd api && npm run test:integration   # precisa do Postgres (docker compose up -d postgres)
cd web && npm run lint && npm test
cd web && npm run test:e2e
# com navegador visível:
cd web && npm run test:e2e:headed
# lint + unit + typecheck + build + integração + e2e:
make ci
```

A API cobre status derivado, ofuscação de IDs e o service de inscrição (lotado / e-mail duplicado / sucesso). O teste de integração dispara inscrições e alterações de capacidade ao mesmo tempo contra o Postgres: a vaga não estoura e a capacidade nunca cai abaixo do número de inscritos. O Playwright abre o app como usuário: cria 5 eventos, lota 3, valida status e a lista de inscritos. O relatório final fica em [`RELATORIO-E2E.md`](RELATORIO-E2E.md).

No GitHub Actions o job `api` roda lint, unit, typecheck, build e o teste de integração (Postgres de serviço). O job `web` roda lint, unit, typecheck, build e o Playwright: sobe Postgres + API + frontend, executa o fluxo e envia o relatório como artifact.

## Variáveis de ambiente

Nada sensível fica hardcoded. Veja [.env.example](.env.example):

- `DATABASE_URL` — conexão Postgres
- `API_PORT` / `API_HOST`
- `CORS_ORIGIN`
- `SQIDS_ALPHABET` / `SQIDS_MIN_LENGTH`
- `LOG_LEVEL`
- `API_KEY` — segredo compartilhado da API. Veja a seção abaixo.
- `VITE_API_BASE_URL` — no browser, `/api/v1`

## API key: o que ela faz (e o que ela não faz)

A `API_KEY` **não é login de usuário**. O desafio não pede autenticação; a chave é um segredo compartilhado entre a API e quem tem permissão de chamá-la (Nginx, proxy do Vite, scripts, CI).

Ela resolve um problema só: impedir que qualquer pessoa na rede use as rotas de negócio se a porta da API vazar. Sem o header `X-API-Key` correto, `GET/POST/PATCH/DELETE /api/v1/...` responde `401 UNAUTHORIZED`.

O que fica **aberto de propósito**:

- `/healthz` e `/readyz` — o kubelet e o Docker healthcheck precisam bater sem o segredo.
- `/metrics` — o Prometheus precisa scrapar sem o segredo.

Como a chave é comparada: os dois lados passam por SHA-256 e `timingSafeEqual`. Assim o tempo de resposta não denuncia se o palpite “quase acertou”.

O JavaScript do frontend **nunca** carrega a chave. O browser chama `/api/...` no mesmo origin; o Nginx (produção) e o proxy do Vite (dev) injetam `X-API-Key` no encaminhamento. Quem fala com a API direto na porta 3002 precisa enviar o header.

Em produção troque `dev-events-api-key` por um valor longo e aleatório. Isso **não** substitui OAuth, sessão ou RBAC: qualquer cliente que tenha a chave tem o mesmo poder.

## Sqids: o que eles fazem (e o que eles não fazem)

O banco usa inteiro autoincremento (`1, 2, 3`). Se esse número saísse no JSON, qualquer um enumeraria eventos (`/events/1`, `/events/2`, …). O Sqids transforma o inteiro num token opaco e estável (`aB3xK9m2`), com alfabeto e tamanho mínimo configuráveis (`SQIDS_ALPHABET`, `SQIDS_MIN_LENGTH`).

Papel na API:

- **Encode na saída** — o cliente só vê o id público.
- **Decode na entrada** — rota `/events/:id` volta ao inteiro para o Prisma.
- **Rejeita id adulterado** — o decode só vale se o re-encode for idêntico ao que chegou. String aleatória vira `400 INVALID_ID`.

O inteiro **não sai** da API. Isso não é criptografia nem autorização: quem tem o id público ainda acessa o recurso (não há login). Só impede enumeração trivial e esconde a ordem de criação.

Não usamos UUID no lugar: o token continua curto, o encode é determinístico e o banco fica com PK inteiro (índice e FK mais simples). Sem a mesma `SQIDS_ALPHABET` o id público não decodifica — por isso a variável é compartilhada entre ambientes.

## Arquitetura

```
api/   Fastify
  src/routes → services → repositories
  src/lib    sqids, logger, metrics, prisma
web/   Vite + React
  src/pages  só orquestram
  src/components  composition components (EventCard.Status, …)
infra/k8s
infra/observability
```

A API é stateless. Estado vive no Postgres. O frontend é um SPA estático atrás do Nginx, que faz proxy de `/api` na imagem de produção.

Status do evento **não é coluna**: `full` se `registeredCount >= capacity`, `past` se a data já passou, senão `upcoming`.

## Kubernetes

Manifests de exemplo em [`infra/k8s`](infra/k8s): `Deployment`, `Service`, `ConfigMap`, `Secret` e um `Job` de migration.

```bash
kubectl apply -k infra/k8s
```

Ajuste a imagem (`events-api:latest` / `events-web:latest`), o `DATABASE_URL` e o `API_KEY` do secret. Probes usam `/healthz` e `/readyz`.

A API é **stateless**: réplicas não gravam disco e **não** rodam migration no boot (`RUN_MIGRATIONS=false`). No Compose, um único serviço sobe com `RUN_MIGRATIONS=true`. No Kubernetes, o Job `events-api-migrate` aplica o schema **antes** de escalar o Deployment.

## O que faria a seguir

- Auth/RBAC (hoje há só `API_KEY`; o desafio não pede login).
- CI/CD até deploy (hoje o GitHub Actions já roda lint, build, integração e Playwright).
- Tracing com OpenTelemetry.
- HPA e Postgres gerenciado.
- E-mail de confirmação de inscrição.

## Uso de IA

Este repositório foi desenvolvido com auxílio de ferramenta de IA. As decisões de stack, ofuscação de IDs, transação de vagas, composition components e o recorte de observabilidade estão documentadas aqui para serem explicadas na entrevista.

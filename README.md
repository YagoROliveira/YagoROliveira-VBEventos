# VB Eventos

Plataforma de gestão de eventos (backend + frontend) pronta para rodar localmente e com caminho claro para Kubernetes.

Uma API Node/Fastify persiste eventos e participantes no Postgres via Prisma. O frontend React lista, cria, edita e inscreve pessoas, respeitando o limite de vagas. IDs sequenciais nunca saem do banco: a API devolve Sqids.

## Por que esta stack

- **Node + TypeScript + Fastify** — runtime conhecido, tipagem e servidor leve com hooks nativos para health, métricas e logs.
- **Prisma + Postgres** — schema-first, client tipado e migrations oficiais. TypeORM resolveria o mesmo problema, mas com mais mágica de runtime e tipos mais frouxos em QueryBuilder. Neste tamanho de domínio (2 models + transação de vagas), Prisma entrega mais clareza. Se um filtro derivado ficar complexo, o repositório já usa SQL explícito (`$queryRaw`) em vez de forçar o client.
- **Sqids** — ofusca `1` em um id público estável (`Lk3x9...`). O inteiro fica só no banco.
- **React + Vite + Zustand + TanStack Query + shadcn** — UI rápida de montar. Filtros e modo de visualização ficam na URL; Query guarda server state.
- **Prometheus + Loki + Grafana + Alloy** — observabilidade sobe no mesmo `docker compose up`. Sem passo extra.

## O que a aplicação faz

- CRUD de eventos: nome, descrição, data/hora, local, capacidade.
- Inscrição de participantes por evento, com trava `SELECT ... FOR UPDATE` para não estourar vagas (409 `EVENT_FULL`).
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
cd api && npm test
cd web && npm test
cd web && npm run test:e2e
# com navegador visível:
cd web && npm run test:e2e:headed
# build + unit + e2e (sobe API/web/Postgres, depois derruba):
make ci
```

A API cobre status derivado, ofuscação de IDs e o service de inscrição (lotado / e-mail duplicado / sucesso). O Playwright abre o app como usuário: cria 5 eventos, lota 3, valida status e a lista de inscritos. O relatório final fica em [`RELATORIO-E2E.md`](RELATORIO-E2E.md).

No GitHub Actions o job `web` também roda o Playwright depois do `npm run build`: sobe Postgres + API + frontend, executa o fluxo e envia o relatório como artifact.

## Variáveis de ambiente

Nada sensível fica hardcoded. Veja [.env.example](.env.example):

- `DATABASE_URL` — conexão Postgres
- `API_PORT` / `API_HOST`
- `CORS_ORIGIN`
- `SQIDS_ALPHABET` / `SQIDS_MIN_LENGTH`
- `LOG_LEVEL`
- `API_KEY` — obrigatória nas rotas `/api/v1`. Health (`/healthz`, `/readyz`) e `/metrics` ficam abertos para probe e scrape.
- `VITE_API_BASE_URL` — no browser, `/api/v1`

O frontend público **não** carrega a chave no JavaScript. O Nginx (e o proxy do Vite) injeta `X-API-Key` ao encaminhar `/api`. Quem chama a API direto (porta 3002) precisa enviar o header. Em produção, troque `dev-events-api-key` por um valor longo e aleatório.

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
- CI/CD até deploy (hoje o GitHub Actions já roda lint, build e Playwright).
- Tracing com OpenTelemetry.
- HPA e Postgres gerenciado.
- E-mail de confirmação de inscrição.
- Teste de integração contra Postgres real no CI.

## Uso de IA

Este repositório foi desenvolvido com auxílio de ferramenta de IA. As decisões de stack, ofuscação de IDs, transação de vagas, composition components e o recorte de observabilidade estão documentadas aqui para serem explicadas na entrevista.

# Relatório E2E — VB Eventos

- **Status geral:** SUCESSO
- **Início:** 22/09/2026, 11:24:13
- **Fim:** 22/09/2026, 11:24:40
- **Duração da suíte:** 26.9s
- **Testes:** 2 (2 passaram, 0 falharam)

## Casos

| Caso | Status | Duração | Observação |
| --- | --- | --- | --- |
| chromium > full-flow.spec.ts > Fluxo completo de gestão de eventos > alterna Cards e Lista em um clique | PASSOU | 1.7s | — |
| chromium > full-flow.spec.ts > Fluxo completo de gestão de eventos > cadastra 5 eventos, lota 3 e valida inscritos e status | PASSOU | 22.8s | — |

## O que o fluxo cobriu

- Alternância Cards ↔ Lista sem precisar clicar duas vezes
- Cadastro de 5 eventos pelo formulário
- Inscrição de participantes aleatórios até lotar 3 eventos
- Validação do status Lotado na listagem e no detalhe
- Validação da lista de inscritos
- Tentativa de inscrição extra em evento lotado

Artefatos do Playwright: `web/playwright-report/` (HTML, JSON, vídeos e traces).

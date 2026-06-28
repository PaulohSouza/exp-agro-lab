# 01 — Estratégia de testes

## Pirâmide
- **Unitários (base):** `packages/domain` (geração de croqui, cálculo de unidade de saída, transições de fluxo) e `packages/analytics` (cada teste estatístico). Sem framework, rápidos.
- **Integração:** `apps/api` (casos de uso, persistência Prisma/MySQL, sync push/pull idempotente) com banco de teste (Docker).
- **E2E (topo):** criar experimento ponta-a-ponta (web) — ver [02-casos-testes](02-casos-testes.md). Mobile: ciclo offline → sync.

## Golden tests da estatística (crítico)
Para garantir **fidelidade ao SAGRE** sem R em produção:
1. Exportar do SAGRE **fixtures**: dataset de entrada + saída esperada (ANOVA table, médias, letras, p-values) para cada rota/delineamento.
2. Guardar em `packages/analytics/__fixtures__/sagre/`.
3. Teste compara saída TS × fixture com **tolerância numérica** (ex.: p-values e médias com `abs/rel tolerance` documentada; letras de agrupamento idênticas).
4. Um algoritmo só é "pronto" quando passa o golden test correspondente. Ordem segue as fases A→B→C de [sagre-analytics](../08-anexos/sagre-analytics.md).

## Critérios de aceitação
- Domínio com cobertura alta nas regras (croqui, RN-CALC/RN-PROD, RN-FLUXO, RN-SYNC).
- Sync: nenhum dado perdido; conflitos sempre marcados.
- Estatística: golden tests verdes dentro da tolerância antes de liberar análise ao usuário.

## Ferramentas
- Vitest/Jest (unit/integração), Playwright (E2E web), Detox/Maestro (E2E mobile), Testcontainers/Docker (MySQL de teste).

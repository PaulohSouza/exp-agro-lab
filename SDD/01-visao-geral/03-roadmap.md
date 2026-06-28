# 03 — Roadmap / Etapas de desenvolvimento

Sequência incremental, cada marco entrega uma fatia utilizável. Datas são relativas ao início (28/06/2026); ajustar conforme capacidade.

## Marco 0 — Fundação do monorepo ✅ (concluído 28/06/2026)
- Monorepo TS (pnpm/turbo): `apps/api` (NestJS+Prisma), `apps/web` (Next.js), `apps/mobile` (placeholder), `packages/domain`.
- Banco **`expagrolab_dev`** (MySQL local, separado do `sagre`) + migração `init` + seed do cenário PC1699 (20 parcelas, croqui 5×4).
- `packages/domain` com croqui (DBC/DIC), RN-PROD e fluxo — **16 testes passando**.
- Módulo de e-mail com modo **SIMULATE** (espelha o SAGRE). Health endpoint `db: up`.
- **Entregue:** `pnpm i`, migrate, seed, API em :3001 e Web em :3000. Ver [DEVELOPMENT.md](../../DEVELOPMENT.md).
- Pendente (não bloqueante): `packages/analytics`/`packages/ui` (entram nos Marcos 4 e 1), CI no GitHub.

## Marco 1 — Núcleo do experimento + croqui (MVP-1) ⭐ — em andamento
Foco escolhido. Ver [requisitos funcionais](../02-requisitos/01-requisitos-funcionais.md) RF-01..RF-12.
- ✅ **Fatia 1 (28/06/2026):** API de experimentos (criar/listar/detalhar), **fatores→tratamentos** (produto cartesiano), **geração de croqui** (DIC/DBC via `@exp/domain`) e **salvar layout**. Web: lista + criação + detalhe com abas (Geral/Fatores/Tratamentos/Croqui) e **editor de croqui clique-e-arraste** (swap de tratamentos, recasualizar, salvar). E2E verificado.
- ✅ **Fatia 2 (28/06/2026):** Tratamentos ricos — modelos `Produto`/`Atividade`/`Timing`/`TratamentoProduto`; API de cadastros (produtos/atividades), timings por experimento e CRUD de produtos do tratamento; aba **Tratamentos** editável na web (nome + linhas de produto com modo/dose/unidade/volume de calda/referência/timing/atividade, add/excluir), espelhando o print. Seed PC1699 com Punto/Agefix/Tidil. E2E verificado.
- ⬜ Próximo: objeto de estudo genérico + cadastros (local, safra…) na UI; delineamento fatorial 2–3 na UI; avaliações (cadastro + lançamento) e **apresentação de produtividade no relatório**.
- **Entrega-alvo:** criar um experimento completo ponta-a-ponta na web; cenário E2E em [06-testes/02-casos-testes.md](../06-testes/02-casos-testes.md).

## Marco 2 — Coleta mobile offline-first
- App RN: download do protocolo/croqui, lançamento de avaliações por parcela, fotos.
- Persistência local (SQLite/WatermelonDB) + fila de sincronização + resolução de conflito.
- **Entrega:** coletar avaliações sem internet e sincronizar.

## Marco 3 — Fluxos (comercial × interno) e aprovação
- Orçamento (fluxo comercial): itens, valores, aprovação CAD; status do protocolo (Inserindo, Aprovado, Recusado…).
- Fluxo interno (TCC) sem custo. Trilha de auditoria de status.
- **Entrega:** lista de protocolos com filtros (igual ao print) e ciclo de aprovação.

## Marco 4 — Análise estatística (port do SAGRE)
- `packages/analytics`: ANOVA, comparação de médias (Tukey/Scott-Knott), fatorial, não-paramétrico, conjunta multi-local.
- **Golden tests** contra saídas do SAGRE. Ver [08-anexos/sagre-analytics.md](../08-anexos/sagre-analytics.md).
- **Entrega:** análise de um experimento real com resultado equivalente ao SAGRE.

## Marco 5 — Relatório PPTX
- Geração do relatório no formato `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx` (lib JS de PPTX) a partir da análise.
- **Entrega:** relatório baixável idêntico em estrutura ao modelo.

## Marco 6 — Endurecimento
- Segurança (papéis/permissões finos), observabilidade, backup, performance do croqui em telas grandes, acessibilidade.

## Dependências entre marcos
```
M0 ─► M1 ─► M2
        └─► M3
        └─► M4 ─► M5
M1..M5 ─► M6
```

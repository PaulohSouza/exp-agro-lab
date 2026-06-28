# 03 — Tecnologias e justificativas

## Stack escolhida
| Camada | Tecnologia | Justificativa |
|---|---|---|
| Monorepo | pnpm + Turborepo | Compartilhar `domain`/`analytics`/`ui` entre apps; build incremental. |
| Linguagem | TypeScript (ponta-a-ponta) | Uma linguagem só (API + web + mobile); tipos compartilhados; já usada no `apppesquisa`. |
| API | **NestJS** | Estrutura modular, DI, fácil testar; bom para casos de uso e endpoints de sync. |
| ORM/DB | **Prisma + MySQL** | MySQL exigido (instância local do SAGRE-app); Prisma dá migrações e tipos. |
| Contratos | tRPC ou REST + Zod | Tipos compartilhados web↔api; Zod valida na borda e no domínio. |
| Web | **Next.js + React** | SSR/rotas, ecossistema maduro para o editor de croqui. |
| Croqui | dnd-kit (ou react-dnd) + canvas/SVG | Clique-e-arraste performático; grid de parcelas. |
| Mobile | **React Native** | Igual ao app atual; offline-first. |
| Persistência offline | WatermelonDB **ou** Drizzle+SQLite | Banco local + sync; escolher no Marco 2. |
| Estatística | TS puro (`packages/analytics`) | Port do SAGRE; ver risco abaixo. |
| Álgebra/estat. | bibliotecas numéricas TS (ex.: jStat, ml-matrix) | ANOVA (QR/least squares), distribuições, testes. |
| Relatório | **pptxgenjs** | Gera `.pptx` no formato do modelo (officer→pptxgenjs). |
| Planilhas | exceljs | Import/export Excel (compat. SAGRE/legado). |
| Auth | JWT + refresh (Passport/Nest) | Papéis e permissões. |
| Infra dev | Docker Compose (MySQL) | Reproduzível; usa MySQL local existente. |

## Justificativa das decisões fundacionais
- **TypeScript full-stack:** elimina divergência de tipos entre back/front/mobile e permite reusar regras (croqui, cálculo de avaliação) no app offline. Trade-off aceito: estatística não vem "de graça" como em R.
- **Sem R em produção (port para TS):** simplifica deploy e remove dependência de runtime R. **Risco:** reimplementar a estatística validada do SAGRE pode divergir numericamente. **Mitigação:** port **faseado** (começar pela rota mais comum) + **golden tests** comparando saídas TS × SAGRE em fixtures reais. Ver [sagre-analytics](../08-anexos/sagre-analytics.md) e [testes](../06-testes/01-estrategia-testes.md).

## Alternativas consideradas (e por que não)
- **Laravel + React** (como o comercial): produtivo no CRUD, mas sem tipos compartilhados com mobile e mais atrito no offline/croqui. Mantido como referência de telas.
- **Microserviço R (plumber)** para estatística: menor risco numérico, mas adiciona runtime R em produção — **descartado pela decisão de não ter R em produção**. (Se a fidelidade do port se mostrar custosa, reabrir esta opção.)

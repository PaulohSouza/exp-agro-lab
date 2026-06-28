# 03 — Roadmap / Etapas de desenvolvimento

Sequência incremental, cada marco entrega uma fatia utilizável. Datas são relativas ao início (28/06/2026); ajustar conforme capacidade.

## Marco 0 — Fundação do monorepo ✅ (concluído 28/06/2026)
- Monorepo TS (pnpm/turbo): `apps/api` (NestJS+Prisma), `apps/web` (Next.js), `apps/mobile` (placeholder), `packages/domain`.
- Banco **`expagrolab_dev`** (MySQL local, separado do `sagre`) + migração `init` + seed do cenário PC1699 (20 parcelas, croqui 5×4).
- `packages/domain` com croqui (DBC/DIC), RN-PROD e fluxo — **16 testes passando**.
- Módulo de e-mail com modo **SIMULATE** (espelha o SAGRE). Health endpoint `db: up`.
- **Entregue:** `pnpm i`, migrate, seed, API em :3001 e Web em :3000. Ver [DEVELOPMENT.md](../../DEVELOPMENT.md).
- Pendente (não bloqueante): `packages/analytics`/`packages/ui` (entram nos Marcos 4 e 1), CI no GitHub.

## Marco 1 — Núcleo do experimento + croqui (MVP-1) ⭐ — ✅ concluído
Foco escolhido. Ver [requisitos funcionais](../02-requisitos/01-requisitos-funcionais.md) RF-01..RF-12.
- ✅ **Fatia 1 (28/06/2026):** API de experimentos (criar/listar/detalhar), **fatores→tratamentos** (produto cartesiano), **geração de croqui** (DIC/DBC via `@exp/domain`) e **salvar layout**. Web: lista + criação + detalhe com abas (Geral/Fatores/Tratamentos/Croqui) e **editor de croqui clique-e-arraste** (swap de tratamentos, recasualizar, salvar). E2E verificado.
- ✅ **Fatia 2 (28/06/2026):** Tratamentos ricos — modelos `Produto`/`Atividade`/`Timing`/`TratamentoProduto`; API de cadastros (produtos/atividades), timings por experimento e CRUD de produtos do tratamento; aba **Tratamentos** editável na web (nome + linhas de produto com modo/dose/unidade/volume de calda/referência/timing/atividade, add/excluir), espelhando o print. Seed PC1699 com Punto/Agefix/Tidil. E2E verificado.
- ✅ **Fatia 3 (28/06/2026):** Avaliações — `AvaliacoesModule` (cadastro, edição, lançamento de **valor bruto** por parcela com upsert **idempotente**, listagem de dados e **relatório** que converte para a unidade de saída em tempo de relatório via `@exp/domain`, com média por tratamento). Aba **Avaliações** na web: lista + nova avaliação + painel **Lançar** (valor bruto + apontamentos da colheita) + painel **Relatório** (kg/ha por parcela e médias). Confirma RN-PROD: coleta bruta, conversão no relatório.
- ✅ **Fatia 4 (28/06/2026):** **Geral editável** + **cadastros**. API: cadastros de objeto de estudo genérico (categoria→subcategoria→objeto), locais, safras, áreas, delineamentos (listar/criar) e `PUT /experimentos/:id`. Web: aba **Geral** como formulário (objeto de estudo em cascata, local/safra/área/delineamento, parcela, textos) e página **/cadastros**. Delineamento do experimento passa a **dirigir o croqui** (regenerar usa o delineamento cadastrado). Correção: regenerar croqui/redefinir fatores limpa lançamentos atrelados às parcelas (evita erro de FK).
- ✅ **Fatia 5 — polimento (28/06/2026):** aba **Fatores** com **1–3 fatores na UI** (níveis por fator → produto cartesiano → tratamentos, com prévia da contagem). **Exportação Excel** (`exceljs`): `GET /experimentos/:id/export.xlsx` com abas Geral/Tratamentos/Croqui/Dados (produtividade calculada), botão "Exportar Excel" no detalhe (download autenticado via blob). _PDF/PPTX ficam para o Marco 5 (relatório)._
- **Entrega-alvo:** criar um experimento completo ponta-a-ponta na web; cenário E2E em [06-testes/02-casos-testes.md](../06-testes/02-casos-testes.md).

## Autenticação & compartilhamento (RF-20..26) — em andamento
- ✅ **Etapa A (28/06/2026):** auth backend — login JWT + bcrypt, registro de instituição (cria instituição + admin), `/auth/me` protegido, guard + decorators (`@Public`, `@CurrentUser`). Seed com `admin@demo.com`/`admin123` e `analista@demo.com`/`analista123`.
- ✅ **Etapa B (28/06/2026):** guard JWT **global** (`@Public` em login/registro/health), **escopo por instituição** (RN-TENANT) nos experimentos (lista/acesso/CRUD com `garantirAcesso`, owner = usuário atual), módulo **Usuários** (admin cadastra/lista). Web: **/login** (entrar + registrar instituição), **Protected** (header com usuário/logout + nav), **/usuarios**, e token JWT anexado a todas as chamadas (401 → /login). Verificado: 401 sem token, outra instituição vê 0 e recebe 403, não-admin 403 ao criar usuário.
- ✅ **Etapa C (28/06/2026):** **compartilhamento** de experimentos (RF-23..25). API: compartilhar por e-mail com nível **input/edit** (auto-aceito se usuário existe; senão **convite por e-mail simulado** com token), listar e revogar (dono/admin). Lista inclui **compartilhados comigo**. Enforcement do nível: `garantirAcesso` aplicado em avaliações (lançar = input; cadastrar/editar = edit) e tratamentos (edit). Web: aba **Compartilhar** (form e-mail+nível, lista, revogar) + badge "compartilhado" na lista. Verificado: input lança mas não edita (403); edit edita; revogar tira acesso.
- ✅ **Etapa D — Ordem de Serviço (RF-26, 28/06/2026):** fluxo comercial completo. API: `InstituicaoModule` (política `todos`/`n_de_m` + aprovadores) e `OrdemServicoModule` (criar → submeter → **aprovação interna por política** → **aprovação do cliente por e-mail/token**, endpoint **público** de decisão). Web: aba **Ordem de Serviço** (criar/submeter/aprovar interno/ver status), página **/instituicao** (política + aprovadores, admin) e página **pública /aprovacao/[token]**. Verificado E2E: submeter → aprovação interna 1-de-N → e-mail simulado → cliente decide por token → OS aprovada; não-aprovador bloqueado.

## Marco 2 — Coleta mobile offline-first — em andamento
- ✅ **Fatia 1 — fundação de sync (28/06/2026):** helpers no `packages/domain` (`chaveColeta` idempotente, `resolverColeta` LWW, `dedupLote`) com 3 testes; API `SyncModule`: `GET /sync/experimentos/:id` (pacote offline: estrutura+croqui+avaliações+dados) e `POST /sync/push` (lote idempotente, dedup, **resolução de conflito** marcando — nunca descarta). Verificado: dedup, conflito por timestamp, origem `mobile`.
- ✅ **Fatia 2 — app Expo (28/06/2026):** `apps/mobile` (Expo SDK 52 + expo-router, **fora do workspace pnpm**). Telas: login, protocolos (lista via pull), coleta por parcela com **fila offline** (AsyncStorage) e botão **Sincronizar** (push, avisa conflitos). Helpers de sync em cópia local. **Compila (npm install + tsc OK); runtime a validar em device** — ver `apps/mobile/README.md` (definir `EXPO_PUBLIC_API_BASE` com o IP da máquina).
- ⬜ Próximos (fatia 3): fotos por parcela, detecção automática de conectividade, persistência SQLite, e migrar coleta para usar `/sync/push` com `clientUpdatedAt` por campo.
- **Entrega:** coletar avaliações sem internet e sincronizar (app pronto para teste em device).

## Marco 3 — Fluxos (comercial × interno) e aprovação
- Orçamento (fluxo comercial): itens, valores, aprovação CAD; status do protocolo (Inserindo, Aprovado, Recusado…).
- Fluxo interno (TCC) sem custo. Trilha de auditoria de status.
- **Entrega:** lista de protocolos com filtros (igual ao print) e ciclo de aprovação.

## Marco 4 — Análise estatística (port do SAGRE) — em andamento
- ✅ **Fase A (28/06/2026):** `packages/analytics` puro — distribuições (F, t, qui-quadrado via beta/gama incompleta), **ANOVA 1 fator DIC/DBC** (decomposição, CV, F, p), **Bartlett** (homogeneidade) e **comparação de médias LSD (Fisher) com letras**. 9 testes (distribuições vs tabela, ANOVA F=13.5 exato, letras). API: `GET /avaliacoes/:id/analise` (usa o delineamento + valores de saída). Web: painel **Análise** na aba Avaliações (tabela ANOVA, médias+letras, CV, Bartlett). Seed popula as 20 parcelas → análise real (F≈373, CV 1,2%).
- ⬜ **Fase B:** Tukey/Scott-Knott (qtukey), fatorial 2–3, transformações, não-paramétrico, conjunta multi-local, e **golden tests vs SAGRE** (precisa dos outputs do R). Ver [08-anexos/sagre-analytics.md](../08-anexos/sagre-analytics.md).
- **Entrega:** análise de um experimento real (fase A entregue; equivalência exata ao SAGRE na fase B).

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

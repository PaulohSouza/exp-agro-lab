# STATUS do projeto — EXP-AGROLAB

> **Handoff para retomar em nova conversa.** Última atualização: 30/06/2026.
> **Onde estamos:** **analytics fase B/C concluída e mergeada** (PR #20, tag **v0.10.0**) — ANOVA fatorial 2–3 + desdobramento, transformações √/log/Box-Cox, não-paramétrico Kruskal/Friedman, análise conjunta multi-local (G×A) e Shapiro-Wilk + seleção de rota. Antes: croqui split-plot (v0.9.0), padronização de código + CI (v0.8.0, ver §0), catálogo/coleta (v0.7.0). **`main` no padrão.**
> **Comece por aqui:** §3.1–3.6 (analytics) e §8 (próximos passos — agora o gargalo é **golden tests vs SAGRE**). Leia também [CLAUDE.md](CLAUDE.md) + [SDD/README.md](SDD/README.md) + o **[padrão de desenvolvimento](SDD/03-arquitetura/04-padroes-desenvolvimento.md)**.
> Testes: **domain 59** + **analytics 75** + **10 suites e2e** (Playwright Python em `e2e/`, ver `e2e/README.md`). **CI** roda tudo no PR ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## 0. Padronização de código (concluída em 29/06/2026)
Iniciativa para alinhar todo o código a um padrão único — ver **[SDD/03-arquitetura/04-padroes-desenvolvimento.md](SDD/03-arquitetura/04-padroes-desenvolvimento.md)** (§12 = progresso). Tudo mergeado na `main`, cada etapa verificada (typecheck + 59+24 testes + build + reseed + 5 e2e):
- **CI** (GitHub Actions): job `unit` (build/typecheck/test) + job `e2e` (MySQL + 5 suites). PR #2.
- **Ferramental:** ESLint (flat) + Prettier + `naming-convention`. PR #4.
- **Documento do padrão** (+ decisão **D6**). PRs #3, #7.
- **Temas de schema** (1 PR cada, migração preservando dados): booleanos `is/has` (#5) · enums `UPPER_SNAKE` (#6) · timestamps `At` (#8) · abreviações por extenso (#9) · `User`→`Usuario` (#10) · **`DominioValor`** = dicionário de enums no banco/D6 (#11).
- **Validação Zod** na borda em **todos os 48 endpoints** `@Body` (#12, #13).
- **Follow-ups opcionais:** UI consumir rótulos de `DominioValor` (substituir mapas hardcoded); `userId` mantido como convenção de auth.
- **Nota:** o `node_modules` de `apps/mobile` foi tocado por um sed durante o rollout — rodar **`npm ci` em `apps/mobile`** antes do próximo trabalho no mobile.

## 1. O que é
Sistema de gestão de experimentos agronômicos e laboratoriais: experimentos de 1–3 fatores, tratamentos, croqui clique-e-arraste, avaliações (valor bruto), dois fluxos (interno/comercial), multi-instituição com compartilhamento, análise estatística e relatório PPTX. Objeto de estudo genérico (cultura, máquina, pessoa/atleta…).

## 2. Stack
Monorepo TypeScript (pnpm + Turborepo):
- `packages/domain` — núcleo puro: croqui (DIC/DBC + **split-plot**), RN-PROD (produtividade), fluxo de status, helpers de sync. **59 testes**.
- `packages/analytics` — estatística pura: ANOVA (1 fator + **split-plot 2 erros** + **fatorial 2–3 com desdobramento** + **conjunta multi-local G×A**), **transformações (√/log/Box-Cox c/ λ por verossimilhança)**, **não-paramétrico (Kruskal-Wallis+Dunn / Friedman+Nemenyi)**, pressupostos (**Bartlett + Shapiro-Wilk**) com **seleção de rota**, **Tukey/Scott-Knott/LSD** (`ptukey`/`qtukey`), distribuições F/t/χ² + `normInv`. **75 testes**.
- `apps/api` — NestJS + Prisma + **MySQL** (`expagrolab_dev`). JWT/bcrypt.
- `apps/web` — Next.js (App Router), tema azul do TCC.
- `apps/mobile` — Expo + expo-router (offline-first). **Fora do workspace pnpm** (usa npm).

## 3. O que está PRONTO ✅
| Área | Estado | Onde |
|---|---|---|
| Monorepo + DB + seed | ✅ | `pnpm i`, migração `init`, seed PC1699 (20 parcelas com dados) |
| Experimento (Geral editável) | ✅ | web `/experimentos/[id]` aba Geral; `PUT /experimentos/:id` |
| Cadastros (objeto genérico, local, safra, área, delineamento, produto, atividade) | ✅ | web `/cadastros`; `CadastrosModule` |
| Fatores 1–3 → tratamentos (produto cartesiano) | ✅ | aba Fatores; `POST /experimentos/:id/fatores` |
| Tratamentos com produtos/dose/modo/volume/timing/atividade | ✅ | aba Tratamentos; `TratamentosModule` |
| Croqui automático (DIC/DBC) + **drag-drop** + recasualizar | ✅ | aba Croqui; `gerarCroqui`/`salvarCroqui` |
| Avaliações: cadastro + **lançar valor bruto** (web) | ✅ | aba Avaliações → Lançar; `AvaliacoesModule` |
| Relatório de produtividade (kg/ha no relatório, não na coleta) | ✅ | aba Avaliações → Relatório |
| **Análise estatística** (ANOVA DIC/DBC, CV, Bartlett, **Tukey/Scott-Knott/LSD**) | ✅ fase B parcial | aba Avaliações → Análise (seletor de método); `GET /avaliacoes/:id/analise?metodo=` |
| **Relatório PPTX** (capa, resumo, ANOVA+médias+gráfico) | ✅ fase A | botão "Relatório PPTX"; `GET /experimentos/:id/relatorio.pptx` |
| **Exportação Excel** | ✅ | botão "Excel"; `GET /experimentos/:id/export.xlsx` |
| **Autenticação** (JWT/bcrypt) + registro de instituição | ✅ | `/login`; `AuthModule` |
| **Multi-tenancy** (escopo por instituição) + gestão de usuários | ✅ | `/usuarios`; `garantirAcesso` |
| **Compartilhamento** input/edit + convite por e-mail simulado | ✅ | aba Compartilhar; `CompartilhamentoModule` |
| **Ordem de Serviço** (aprovação interna por política + cliente por e-mail/token) | ✅ | aba Ordem de Serviço; `/instituicao`; `/aprovacao/[token]` |
| **Sincronização offline** (pull/push idempotente + conflito) | ✅ | `SyncModule`; helpers em `packages/domain` |
| **App mobile** (login, protocolos, coleta offline, sincronizar) | ⚠️ scaffold | `apps/mobile` — compila; **não testado em device** |
| **Papéis (RBAC) + Dashboard** (fatia 1) | ✅ fatia 1 | enum `Papel` (7) + `Departamento` no schema; JWT carrega `papel`; `GET /dashboard` escopado; tela `/dashboard`. Ver [SDD 07](SDD/04-design-detalhado/07-dashboard.md) / [RBAC](SDD/05-seguranca/03-papeis-rbac.md) |
| **RBAC fatia 2 parte 1** (backend + UI) | ✅ | guard `@RequirePapel` (admin_sistema passa sempre); CRUD `/departamentos` (+ `GET /departamentos/unidades`); `PUT /usuarios/:id` (atribui papel/depto/unidade); dashboard refina escopo por depto/área. UI: card de Departamentos em `/instituicao`; seletores de papel/depto/área em `/usuarios`. |
| **RBAC fatia 2 parte 2** | ✅ | **super-admin global de fato** (`admin_sistema` vê/abre todas as instituições — `listar`/`garantirAcesso` ignoram o tenant; lista mostra a instituição); **responsável de coleta** (`ExperimentoResponsavel`, rotas `/experimentos/:id/responsaveis`) entra no escopo "atribuídos" do painel. UI na aba Compartilhar. Super-admin demo: `root@sistema.com`/`root123`. |
| **Web responsiva** (mobile/tablet) | ✅ | `globals.css` (viewport, box-sizing, `.tabela-scroll`/`.scroll-x`); tabelas roláveis, header/abas sem corte, grids `auto-fit`, containers fluidos. Auditoria das 16 telas. |

## 3.0 Em andamento — Catálogo de avaliações + atividades + coleta agrupada
Branch `feature/catalogo-avaliacoes-coleta`. Reestrutura as avaliações para multi-instituição. Design completo em [SDD/04-design-detalhado/08-catalogo-avaliacoes.md](SDD/04-design-detalhado/08-catalogo-avaliacoes.md). Conceito-base: **dois tipos de registro** — Avaliação (por parcela) × Atividade (geral do experimento: ação / com apontamento).
- **A1 schema** ✅ — `ModeloAvaliacao` (escopo sistema/instituição/depto) + `ModeloAvaliacaoPrereq` (pré-req self-M:N) + `GrupoColeta`/`GrupoColetaItem`; `Avaliacao` ganhou `modeloId`/`grupoColetaId`/`numeroPontos`/`descricaoColeta`. Migration `20260629124049`.
- **A2 domínio** ✅ — `packages/domain/modeloAvaliacao.ts`: visibilidade por escopo, `podeGerenciarEscopo`, fechamento transitivo de pré-requisitos. **+14 testes** (domain agora **44**).
- **A3 API** ✅ — `ModeloAvaliacaoModule` (`/modelos-avaliacao` CRUD c/ RBAC por escopo). Smoke OK: admin instituição cria escopo instituição; escopo sistema só super-admin (403 caso contrário).
- **A4 web** ✅ — página `/catalogo` (link no nav): filtros por escopo (Todos/Geral/Instituição/Depto), tabela com badge de escopo, CRUD gated por papel (`podeGerenciar` espelha o domínio), form com pré-requisitos (checkboxes) e seletor de departamento.
- **A5 integração** ✅ — endpoint `POST /experimentos/:id/avaliacoes/do-modelo` (resolve pré-req transitivos via domínio, herda campos do modelo, não duplica). UI "Adicionar do catálogo" na aba Avaliações avisa os pré-requisitos auto-incluídos. Smoke OK: Produtividade trouxe Umidade junto. **Macro A concluída.**
- **Macro C — catálogo de atividades** (ação/apontamento). Conceito: Atividade = registro GERAL do experimento.
  - **C1 schema** ✅ — `ModeloAtividade` (escopo + tipo `acao`/`apontamento`) + `ModeloAtividadeCampo` (campos parametrizados: numero/texto/data/booleano) + `AtividadeExperimento` + `AtividadeApontamentoValor`. Migration `20260629132327`. (Cadastro simples `Atividade` antigo permanece, separado.)
  - **C2 domínio** ✅ — `packages/domain/atividade.ts`: `validarApontamento` (obrigatórios, tipo do slot, rótulo desconhecido) + `apontamentoEsperado`; escopo reaproveita `podeGerenciarEscopo`. **+7 testes** (domain agora **51**).
  - **C3 API** ✅ — módulo `atividades`: `ModeloAtividadeService`/`/modelos-atividade` (CRUD c/ campos + RBAC por escopo) e `AtividadeExperimentoService` (`/experimentos/:id/atividades`, `/atividades/:id/apontamento`, DELETE). Criar-do-modelo herda nome/tipo e pré-cria valores; apontamento validado pelo domínio (smoke: faltando obrigatório → 400; válido → grava).
  - **C4 web** ✅ — `/catalogo` ganhou subabas **Avaliações | Atividades**; catálogo de atividades com filtro por escopo, editor de campos parametrizados (rótulo/tipo/unidade/obrigatório) e CRUD por papel. Nova aba **Atividades** no experimento: adicionar do catálogo, preencher apontamento (validado) e remover. e2e `e2e/test_atividades.py` (passa).
  - **C5 refatorar a colheita** ✅ — removidos `numLinhasColhidas`/`comprimentoColhidoM`/`areaUtilM2` de `AvaliacaoDado` (migration `20260629151806`). A **área útil** agora vem da **atividade Colheita** (`ModeloAtividade.fornecAreaColheita`, campos `linhas`/`comprimento`) via helper `areaUtilDoExperimento` (única p/ todas as parcelas). `gerarMarcos` cria a Colheita a partir do modelo de sistema (apontamento, é marco), com sub-linha de medições na aba Atividades. Repontados avaliacoes/export/sync; lançamento de massa coleta só o valor. Seed recriado (Colheita + catálogo demo Umidade/Produtividade c/ pré-req avaliação+atividade) + sandbox "SIM 2-Fatores". **RN-PROD validado: CV 1,22%, área 9 m², T4 ≈ 10.717 kg/ha.** **Macro C concluída.** Plano: [SDD/04-design-detalhado/08-c5-plano-colheita.md](SDD/04-design-detalhado/08-c5-plano-colheita.md).
- **Macro D — Período + Cronograma de marcos** ✅ (fora da ordem original, a pedido). `Experimento.tipoPeriodo` (safra | ano_semestre) + `anoSemestre`; toggle na aba Geral. Marcos do cronograma como **atividades** (`AtividadeExperimento.marco`/`dataPrevista`/`confirmada`/`data`): botão "Gerar marcos" (implantação/início/fim + semeadura/colheita se cultura), checklist com previsão + checkbox confirmar + data realizada na aba Atividades. `Categoria.eCultura` (flag; seed marca "Cultura"). Domínio: `marcosPadrao`, `statusMarco`. Migration `20260629150151`. e2e `test_periodo_marcos.py`.
- **Macro B — Coleta agrupada** ✅ (B1–B4; B5 mobile offline = follow-up). Grupos de coleta (CRUD multi-escopo, subaba em `/catalogo`); "Aplicar grupo" no experimento (adiciona avaliações do grupo + pré-req, marca `grupoColetaId`); **coleta em lote**: `POST /experimentos/:id/coleta-lote` (idempotente, `dedupLancamentos`) + grade web (parcela × avaliações) com **filtro por timing/grupo** na aba Avaliações. Domínio `dedupLancamentos`. Smoke: aplicar grupo OK; lote 4→3 (dedupe).
  - **B5 mobile** ✅ (compila; falta device) — sync pull expõe `timingId`/`grupoColetaId` + timings; app ganhou **filtro por timing** nos chips de coleta. O lote offline já funcionava (fila por célula sobre várias avaliações + push unificado).
- **Status geral:** A ✅ · C ✅ (incl. C5) · B ✅ (B5 mobile pendente). Pré-requisitos cruzam avaliações **e** atividades. Testes: **domain 59** + **5 suites e2e** (Playwright Python em `e2e/`, todas passando).

## 3.1 Croqui de 2+ fatores (split-plot) — ✅ implementado (29/06/2026)
Distinção **fatorial × parcela subdividida (split-plot)**, completo nas 4 fatias (PRs #16, #17, #18). Design: [SDD/04-design-detalhado/06-croqui-esquemas.md](SDD/04-design-detalhado/06-croqui-esquemas.md).
- **Domínio** (`packages/domain/croqui.ts`): `gerarParcelaSubdividida`, `validarParcelaSubdividida`, `trocarSubparcela`, `trocarParcelaPrincipal` (coberto pelos 59 testes).
- **Schema** (fatia 1): enum `EsquemaCroqui` + `Experimento.esquema`/`fatorPrincipalOrdem` + `Parcela.grupoPrincipal`/`nivelPrincipal`/`nivelSub` (nullable; `EsquemaCroqui` no `DominioValor`).
- **API** (fatia 2): `gerarCroqui` ramifica (mapeia tratamentos→`TratamentoFatorial`); `salvarCroqui` revalida → **422**.
- **Web** (fatia 3): seletor de esquema + fator principal; render agrupado (borda grossa); arraste em 2 níveis (sub no grupo, principal no bloco).
- **ANOVA** (fatia 4): `anovaSplitPlot` com **dois erros** (Erro(a) testa A; Erro(b) testa B e A×B), 6 testes golden (analytics **30**); `analise` ramifica por `esquema`; web e PPTX renderizam a tabela de 2 erros. e2e `test_split_plot.py`.
- **Follow-up:** comparação de médias por fator no split-plot; strip-plot (SDD 06 §6).

## 3.2 ANOVA fatorial (erro único) + desdobramento — ✅ implementado (30/06/2026)
Fatorial 2–3 fatores cruzados em DIC/DBC, **erro único** (≠ split-plot), com **desdobramento** da interação dupla em efeitos simples. 3 fatias + e2e (branch `feature/analytics-fatorial`). Design: [SDD/04-design-detalhado/06-croqui-esquemas.md](SDD/04-design-detalhado/06-croqui-esquemas.md) / [SDD/08-anexos/sagre-analytics.md](SDD/08-anexos/sagre-analytics.md).
- **Analytics** (fatia 1, `packages/analytics/factorial.ts`): `anovaFatorial` — decomposição de SQ por subconjuntos de fatores (efeitos principais + todas as interações + resíduo); médias por fator com letras (reusa `comparacao.ts`); desdobramento (efeito simples de cada fator dentro dos níveis do outro, F vs QMresíduo) quando a interação dupla é significativa. Balanceado ⇒ Type I = Type II. **12 testes golden** (SQ à mão, aditividade, SQ(A/B)=SQ(A)+SQ(A×B)); analytics **30 → 42**.
- **API** (fatia 2): ramo `FATORIAL` em `AvaliacoesService.analise` — reconstrói o produto cartesiano dos níveis (mesma ordem da geração dos tratamentos) p/ mapear `numeroRef`→nível de cada fator; `RelatorioService` ganha slide PPTX do fatorial.
- **Web** (fatia 3): `AnaliseFatorialView` na aba Avaliações — tabela de erro único, médias por fator e desdobramento por nível.
- **e2e** `test_fatorial.py`: fluxo completo (API) + render da aba Análise (browser). Smoke validado: 2×2 com interação cruzada → A×B F≈262 signif., desdobramento nos 2 sentidos.
- **Follow-up:** desdobramento da interação **tripla** (3-way) — hoje só as interações duplas são desdobradas; **golden tests vs SAGRE**.

## 3.3 Transformações (√ / log / Box-Cox) — ✅ implementado (30/06/2026)
ROTA 2 do SAGRE: quando os pressupostos falham, transforma-se a resposta, refaz-se a ANOVA e as médias são retro-transformadas para apresentação. 2 fatias + e2e (mesma branch). Design: [SDD/08-anexos/sagre-analytics.md](SDD/08-anexos/sagre-analytics.md).
- **Analytics** (fatia 1, `packages/analytics/transform.ts`): `aplicarTransformacao` (√(x+c), log(x+1), Box-Cox), `retroTransformar`, `boxCoxLambda` (verossimilhança perfilada sobre o modelo aditivo tratamento[+bloco], refino parabólico + IC95% via χ², piso no RSS) e `sugerirTransformacao` (λ→transformação padrão). **11 testes golden** (valores à mão, round-trip, recuperação de λ≈1/0,5/0); analytics **42 → 53**.
- **API + web** (fatia 2): `GET /avaliacoes/:id/analise?transformacao=raiz|log|boxcox` aplica antes da ANOVA (todos os esquemas), estima λ do Box-Cox, retorna metadados e **retro-transforma as médias**; o bloco entra no modelo só em DBC/split-plot (em DIC as repetições não são bloco). Web: seletor de transformação na aba Análise + banner de escala transformada.
- **e2e** `test_transformacao.py`: API (metadados + médias retro ≈ originais + λ no interior + CV cai) + browser (seletor + banner). Smoke: nenhuma CV 18,8% → log 4,2%.
- **Follow-up:** seleção automática da transformação (critério maximin nos p-valores dos pressupostos — falta Shapiro-Wilk); arcseno p/ proporções.

## 3.4 Não-paramétrico (Kruskal-Wallis / Friedman) — ✅ implementado (30/06/2026)
ROTA 3 do SAGRE: alternativas à ANOVA quando os pressupostos não são corrigíveis por transformação. 2 fatias + e2e (mesma branch). Design: [SDD/08-anexos/sagre-analytics.md](SDD/08-anexos/sagre-analytics.md).
- **Analytics** (fatia 1, `packages/analytics/naoParametrico.ts`): `kruskalWallis` (H ~ χ²(k−1) com correção de empates + post-hoc de **Dunn**/Bonferroni) e `friedman` (ranqueia dentro do bloco, χ² ~ χ²(k−1) com correção + post-hoc de **Nemenyi** via amplitude estudentizada); ambos com médias de rank e letras. **7 testes golden** (H=7,2; χ²F=8; letras); analytics **53 → 60**.
- **API + web** (fatia 2): `GET /avaliacoes/:id/analise?naoParametrico=true` → Kruskal (DIC) ou Friedman (DBC) por tratamento; não se aplica a parcela subdividida. Web: seletor de teste (paramétrico/não-paramétrico) na aba Análise + médias de rank com letras (oculta transformação/comparação no modo não-paramétrico).
- **e2e** `test_naoparametrico.py`: Kruskal-Wallis (API + browser). Friedman validado pelos golden tests (DBC exige cadastro de delineamento, fora do escopo do e2e).
- **Follow-up:** ART, Conover.

## 3.5 Análise conjunta multi-local (G×A) — ✅ implementado (30/06/2026)
Combina N experimentos em DBC com os mesmos tratamentos (cada experimento = um local). Design: [SDD/08-anexos/sagre-analytics.md](SDD/08-anexos/sagre-analytics.md).
- **Analytics** (`packages/analytics/conjunta.ts`): `anovaConjunta` — modelo Local + Bloco/Local + Tratamento + Local×Trat + Resíduo; **locais aleatórios** ⇒ Tratamento testado pela interação (G×A); razão entre QM-resíduo por local (regra de Cochran ~7×) para validar a junção; médias de tratamento com letras (erro da interação); guard de blocos completos. **6 testes golden** (SQ à mão 242/8/50/2/0/302, GL, F=25, encadeamento de erros).
- **API + web**: `POST /analise/conjunta` (`{experimentoIds, avaliacaoNome}`) agrega os dados por avaliação de mesmo nome; página **`/analise-conjunta`** (seleção de locais + tabela G×A + homogeneidade + médias).
- **e2e** `test_conjunta.py`: 2 locais DBC com interação + resíduo (API + browser).
- **Follow-up:** locais fixos (F vs resíduo), desdobrar G×A por local, conjunta de fatorial.

## 3.6 Pressupostos (Shapiro-Wilk) + seleção de rota — ✅ implementado (30/06/2026)
Destrava a escolha de rota pela checagem de pressupostos. Design: [SDD/08-anexos/sagre-analytics.md](SDD/08-anexos/sagre-analytics.md).
- **Analytics** (`packages/analytics/pressupostos.ts` + `stats.normInv`): `shapiroWilk` (Royston AS R94, 3≤n≤5000; **validado vs R**: [1,2,3,4] W≈0,9929 p≈0,971) e `sugerirRota` (Shapiro nos resíduos + Bartlett → **paramétrica | transformação | não-paramétrico**, com a transformação sugerida pelo λ de Box-Cox). **9 testes**.
- **API + web**: a análise 1-fator devolve `rotaSugerida`; banner na aba Análise mostra W, p e a rota recomendada (advisory — a troca de rota continua manual).
- **Follow-up:** aplicar a rota automaticamente (1 clique); usar Shapiro também em split/fatorial.

## 3.7 Golden tests vs SAGRE — 🔓 em andamento (30/06/2026)
**Desbloqueado:** R 4.6.0 está disponível no ambiente com **`ExpDes.pt`/`agricolae`/`MASS`** (a engine do próprio SAGRE) e as planilhas de teste do SAGRE-app estão em `BD/dados`. A referência é gerada da engine real e **versionada** (a CI compara sem R).
- **Harness** (`packages/analytics/golden/`): `gen-reference.R` lê as planilhas, copia os dados como CSV (`golden/data/`) e grava `golden/reference.json` (ANOVA/CV via `aov()`, cruzado com `ExpDes.pt::fat3.dbc` — casamento à última casa decimal). `src/golden.test.ts` compara o TS contra o JSON.
- **Batch 1 (família ANOVA/fatorial)** ✅ **14 testes**: ANOVA 1 fator DBC (`teste_1fator_dbc_6trat`), fatorial 2×4 DBC (`teste_fatorial_dbc_3x4`) e trifatorial 3×3×2 DBC — incl. **`teste_trifatorial_triplasig_3x3x2`** (interação tripla significativa) — em 2 variáveis-resposta cada. GL/SQ/QM/F/p e CV batem com o SAGRE. O desdobramento triplo foi conferido manualmente contra `fat3.dbc` (SQ/Fc idênticos).
- **Batch 2 (split-plot + médias/letras)** ✅ **+5 testes** (golden **14 → 19**): **split-plot DBC** (`anovaSplitPlot`, tabela de 2 erros + CV1/CV2 vs `ExpDes.pt::psub2.dbc` / `aov(Error(Bloco/A))`, reusando os dados 3×4) e **médias + agrupamento de Tukey** do caso 1 fator (vs `agricolae::HSD.test` — médias exatas e mesmos pares compartilhando letra). Analytics nesta branch: **94** (base main 75 + 19 golden; com o PR #21 somado → 99).
- **Próximos batches:** DIC (1 fator sem bloco), transformações, não-paramétrico, conjunta multi-local, médias/letras em fatorial, e assertions no nível do desdobramento (duplo/triplo).

## 4. Pendências / limitações conhecidas
- **Analytics fase B/C:** **Tukey (HSD)**, **Scott-Knott**, LSD, **split-plot (2 erros)**, **fatorial 2–3 + desdobramento**, **transformações (√/log/Box-Cox)**, **não-paramétrico (Kruskal/Friedman + post-hoc)**, **conjunta multi-local (G×A)** e **Shapiro-Wilk + seleção de rota** ✅ implementados. **Falta:** desdobramento da interação tripla, comparação de médias por fator no split-plot, aplicar a rota sugerida automaticamente, e **golden tests vs SAGRE** (pendente por não ter o ambiente R aqui).
- **PPTX fase A** tem layout próprio; falta aproximar do `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx`.
- **App mobile não foi rodado** (sem device/emulador no ambiente). Compila por `tsc`. Validar com Expo Go.
- E-mails em modo **SIMULATE** (arquivos em `apps/api/email-previews/`), não envia de verdade.
- Sem auth real de senha forte/refresh-token rotation; JWT simples (dev).

## 5. Mapa do código
- **API módulos** (`apps/api/src/`): `auth`, `experimentos`, `cadastros`, `tratamentos`, `avaliacoes`, `usuarios`, `compartilhamento`, `instituicao`, `ordem-servico`, `sync`, `export`, `relatorio`, `email`, `prisma`, `health`.
- **Web páginas** (`apps/web/app/`): `/`, `/login`, `/experimentos`, `/experimentos/[id]` (7 abas), `/cadastros`, `/usuarios`, `/instituicao`, `/aprovacao/[token]`.
- **Schema**: `apps/api/prisma/schema.prisma`. **Seed**: `apps/api/prisma/seed.ts`.

## 6. Como rodar (resumo rápido)
```bash
# pré: Node ≥20, pnpm 9, MySQL local. Banco/credenciais já em apps/api/.env (expagrolab_dev).
pnpm install
pnpm --filter @exp/api exec prisma migrate dev   # aplica migrações (1ª vez)
pnpm --filter @exp/api db:seed                    # cenário PC1699 (20 parcelas com dados)
node apps/api/dist/main.js                         # API em :3001  (rode 'pnpm --filter @exp/api build' antes)
pnpm --filter @exp/web dev                         # Web em :3000 → http://localhost:3000/login
```
Login demo: **admin@demo.com / admin123** (gestão da instituição) · **analista@demo.com / analista123** · **root@sistema.com / root123** (super-admin global).
Mobile: ver `apps/mobile/README.md` (`EXPO_PUBLIC_API_BASE` = IP da máquina).

## 7. Testes a fazer
Ver o checklist completo em **[TESTES.md](TESTES.md)**.

## 8. Próximos passos (handoff — registrado para a próxima conversa)

### 8.0 Concluído (catálogo/coleta + padronização)
- [x] **PR #1** mergeado na `main` + tag **v0.7.0** + release.
- [x] **CI no GitHub** (job unit + job e2e). Roda em todo PR.
- [x] **Padronização de código completa** — ver **§0**. `main` 100% no padrão (booleanos/enums/timestamps/abreviações/`Usuario`/`DominioValor`/Zod).
- [x] **B5** mobile (filtro por timing nos chips; validar em device).

### 8.1 Croqui de 2+ fatores (split-plot) — ✅ feito (ver §3.1, PRs #16–#18)
Implementado nas 4 fatias (schema, API, web, ANOVA 2 erros). Follow-up: comparação de médias por fator no split-plot; strip-plot (SDD 06 §6).

### 8.2 Analytics fase B (completar) — `packages/analytics`
**Split-plot ✅. Fatorial+desdobramento ✅ (§3.2). Transformações ✅ (§3.3). Não-paramétrico ✅ (§3.4). Conjunta multi-local ✅ (§3.5). Shapiro-Wilk + seleção de rota ✅ (§3.6).** Falta: desdobramento da interação tripla · aplicar a rota sugerida em 1 clique · **golden tests vs SAGRE** (bloqueado: precisa dos outputs do R de 1–2 experimentos).

### 8.3 Relatório PPTX fase B
Aproximar do `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx` (layout fiel).

### 8.4 Mobile
Testar em device/emulador (Expo Go) e iterar — inclui validar o filtro de coleta do B5.

### 8.5 Endurecimento / infra
~~CI no GitHub~~ ✅ feito. Restam: refresh-token + senha forte · RBAC fino + auditoria · e-mail real (hoje SIMULATE em `email-previews/`) · observabilidade · **CI ganhar `pnpm lint`/`format:check`** no job unit (actions ainda em Node 20 — bumpar quando saírem `@v5`).

### 8.6 Follow-ups da padronização (opcionais)
UI consumir rótulos de `DominioValor` (substituir mapas hardcoded no web) · `userId`→`usuarioId` se desejado (hoje mantido como convenção de auth). Ver §0.

> **Prioridade sugerida:** (1) **golden tests vs SAGRE** — validar toda a estatística (split-plot/fatorial/transformações/não-paramétrico/conjunta/Shapiro) contra o R; é o que falta para fechar a fase B/C → (2) **PPTX fiel** ao modelo do SAGRE → (3) mobile em device (rodar `npm ci` em `apps/mobile` antes) → (4) endurecimento/infra (§8.5). Analytics fase B/C praticamente completo; sobram só desdobramento da interação tripla e aplicar a rota sugerida em 1 clique.

## 9. Releases
`v0.1.0`…`v0.6.0` (até relatório PPTX) · `v1.0.0-rc.1` (checkpoint fluxo web) · `v0.7.0` (catálogo de avaliações/atividades + período/marcos + coleta agrupada) · `v0.8.0` (CI + padronização de código) · `v0.9.0` (croqui split-plot completo) · **`v0.10.0`** (PR #20 — **analytics fase B/C**: ANOVA fatorial 2–3 + desdobramento · transformações √/log/Box-Cox · não-paramétrico Kruskal/Friedman · análise conjunta multi-local G×A · Shapiro-Wilk + seleção de rota; analytics **75 testes**, **10 suites e2e** — **Latest**). Histórico: https://github.com/PaulohSouza/exp-agro-lab/releases

## 10. Infra / notas de ambiente
- `pnpm` symlinkado em `~/.local/bin`. MySQL local: root via socket (`mysql -u root`); app usa user `expagrolab` em `expagrolab_dev`/`expagrolab_shadow` (NÃO usar schema `sagre`).
- Push/release liberados (`paulosouzafmt` é colaborador). Fluxo: por etapa → commit, push, release.

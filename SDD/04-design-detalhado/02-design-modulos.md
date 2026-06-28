# 02 — Design dos módulos

## packages/domain (núcleo)
Sem dependência de framework. Entradas/saídas tipadas + Zod.
- **experimento/** — montar experimento, derivar tratamentos de fatores (fatorial 1–3), validar consistência (nº tratamentos × repetições = total parcelas).
- **croqui/** — `gerarCroqui(delineamento, tratamentos, blocos, opts)`: casualização (DIC global / DBC por bloco), numeração, posições no grid, ponto de início. `aplicarEdicao(layout, movimentos)` para o drag-drop. Determinístico dado um *seed* (reprodutível). Para **≥2 fatores** o esquema (fatorial × parcela subdividida) muda geração, arraste e validação — ver [06-croqui-esquemas.md](06-croqui-esquemas.md) (`gerarParcelaSubdividida`, `validarParcelaSubdividida`, `trocarSubparcela`, `trocarParcelaPrincipal`).
- **avaliacao/** — `calcularSaida({valorColetado, formula, params})`. Implementa **RN-CALC** e o caso-âncora **RN-PROD** (kg/parcela → kg/ha). Avaliador de fórmula seguro (sem `eval`). ⚠️ Invocado pelo módulo de **relatórios** (tempo de relatório), **não** na coleta/mobile — a coleta guarda valor bruto.
- **fluxo/** — transições de status válidas por `ensaio` (interno × comercial).

## packages/analytics (port do SAGRE)
Estatística pura, golden-validada. **Port faseado** — ver [sagre-analytics](../08-anexos/sagre-analytics.md) para o mapa completo das rotas/algoritmos do SAGRE.
- **Fase A (MVP analítico):** ANOVA 1 fator DIC/DBC (Type II SS via QR), pressupostos (Shapiro-Wilk, Bartlett), comparação de médias **Tukey** e **Scott-Knott**, tabela de médias + letras.
- **Fase B:** fatorial 2 fatores (quali×quali, desdobramento), transformações (Box-Cox/log/sqrt), não-paramétrico (Kruskal-Wallis, Friedman + post-hoc).
- **Fase C:** GLM com auto-seleção de família (Poisson/NegBin/Gamma/…), HNP, conjunta multi-local, 3 fatores, split-plot, modelos mistos.
> Cada algoritmo entra com **fixtures de entrada/saída exportadas do SAGRE** e teste de tolerância numérica antes de ser considerado pronto.

## packages/ui
Componentes React + **tema azul** (ver [design-system](05-design-system.md)). Inclui o **GridCroqui** (renderização de parcelas) reutilizável.

## apps/api (NestJS)
Módulos: `auth`, `instituicoes` (instituição/departamento/unidade/usuários), `cadastros` (objeto de estudo, locais, produtos…), `experimentos`, `compartilhamento`, `tratamentos`, `croqui`, `avaliacoes`, `coleta-sync`, `orcamentos`, `ordem-servico` (aprovações), `dashboard`, `departamentos` (CRUD + atribuição, guard `@RequirePapel`), `analytics`, `relatorios`, `email`.
- `coleta-sync`: endpoints de download (protocolo+croqui+avaliações) e upload em lote idempotente (ver [diagramas](../03-arquitetura/02-diagramas.md)).
- `relatorios`: orquestra `analytics` → `pptxgenjs` no formato do modelo.
- <a id="email"></a>**`email`** (adaptado do SAGRE — blastula→nodemailer): dispatcher com **modo SIMULATE** (renderiza HTML em `email-previews/` + registra `EmailLog` em vez de enviar) e modo real (nodemailer/SMTP). Templates: convite de compartilhamento, aprovação de OS pelo cliente (link/token), recuperação de senha. Variáveis: `EMAIL_ENABLED`, `EMAIL_USER`, `SMTP_PASSWORD`, `SMTP_HOST/PORT`, `SIMULATE_SEND`, `SIMULATE_OUTPUT_DIR`, `EMAIL_BASE_URL`.
- **`ordem-servico`**: gera OS, coleta aprovações internas (1+ aprovadores; política todos/N-de-M) e dispara aprovação do cliente por e-mail; endpoint de decisão por token (RN-APROVA-OS).
- **`dashboard`**: `GET /dashboard` **read-only**, escopado pelo `papel` do JWT (RN-RBAC). Agrega experimentos por status/local/área/safra/ensaio e conta ensaios em condução; deriva o **checklist** de avaliações (Realizada/Pendente/Atrasada) a partir de `Avaliacao.dataPrevista` × `AvaliacaoDado` — sem cadastro novo. Ver [07-dashboard.md](07-dashboard.md).

## apps/web (Next.js)
Telas espelhando o print (abas do protocolo): **Geral, Croqui, Tratamentos, Aplicações, Avaliações, Timeline, Manejo Comum, Resumo, Anexos** + **Lista de protocolos** (filtros) + cadastros. Ver [interfaces](03-interfaces.md).

## apps/mobile (React Native)
Telas mínimas: login, lista de protocolos baixados, croqui (somente leitura/seleção de parcela), lançamento de avaliação por parcela (offline, **valor bruto**), fila de sync. **Não calcula unidade de saída** — só armazena/transmite o bruto (conversão é no relatório).

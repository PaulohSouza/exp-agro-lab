# Anexo — Análises do SAGRE a portar para TypeScript (passo IV)

Mapa do pipeline estatístico do SAGRE (`/mnt/ds/drive/analytics/.../shiny/sagre-app`) para reimplementar em `packages/analytics`, **sem R em produção**, validado por golden tests. Origem: leitura de `R/runExperiment.R`, `R/one_factor/*`, `R/helpers/*`, `modules/mod_etapa*`, `scripts/gerar_apresentacao_pptx.R`.

## Pipeline (7 etapas)
1. **Config** — delineamento (DIC/DBC), nº de fatores (1–3), esquema, tipo de fator (quali/quanti).
2. **Dados** — import (xlsx/csv/colar/API), mapeamento de colunas (trat, bloco, f2, local, cov, aleat), normalização de níveis, tratamento de faltantes.
3. **Criar variáveis / parâmetros** — casas decimais, α (Shapiro, F/χ², comparação de médias), estratégia de transformação, limiar de outlier, tolerância HNP do GLM.
4. **Resíduos/outliers** — Q-Q, resíduos×ajustados, scale-location, resíduos padronizados.
5. **Descritiva** — média, DP, CV por tratamento.
6. **Rota & teste** — cascata automática (ver abaixo) ou manual.
7. **Resultados** — tabela ANOVA/deviance, médias + letras, gráficos (efeito, interação, regressão), export PNG/PDF/SVG/docx/pptx.

## Cascata de rotas (decisão automática)
```
ROTA 1  ANOVA clássica      ← Shapiro p≥α  E  Bartlett p≥α
ROTA 2  ANOVA + transformação ← se transformação (sqrt/log/BoxCox) corrige pressupostos
ROTA 3  GLM (auto-família)   ← se converge melhor (HNP/dispersão/AIC)
ROTA 4  Não-paramétrico      ← fallback
```

## Delineamentos suportados (SAGRE)
DIC, DBC, Split-plot (DIC/DBC), Sub-subparcela (3 fatores), Testemunhas adicionais (Dunnett), **Conjunta multi-local**, Por grupo/timing, Efeitos aleatórios/mistos.

## Métodos por categoria
- **Pressupostos:** Shapiro-Wilk (normalidade), Bartlett / Levene-Brown-Forsythe (homogeneidade), **HNP** (envelope simulado, % fora).
- **ANOVA:** Type II SS (`car::Anova`); modelo `lm(resp ~ trat [+ bloco])`.
- **Transformações:** sqrt, log(y+1), Box-Cox (busca de λ, critério maximin nos p-valores).
- **GLM:** auto-seleção de família/ligação (Gaussian, Poisson, Quasi-Poisson, NegBin, Binomial, Gamma, Inverse-Gaussian, Tweedie) por % fora do HNP, dispersão de Pearson, AIC.
- **Não-paramétrico:** Kruskal-Wallis, Friedman (DBC), ART (aligned-rank); post-hoc Nemenyi, Dunn, Conover, LSD-Friedman.
- **Comparação de médias / letras:** Tukey HSD (emmeans+cld), **Scott-Knott** (engine custom), Duncan, SNK, Dunnett, contrastes, matriz TukeyC (DMS).
- **Conjunta:** ANOVA por local → Bartlett entre locais → F de interação Local×Trat → critério Pimentel-Gomes (max/min s² < 7) → ANOVA combinada.
- **Mistos:** `lme4::lmer`/`glmmTMB`, REML, inferência via emmeans.

## Pacotes R → estratégia em TS
| R | Uso | TS |
|---|---|---|
| car | Type II SS, Levene | implementar SS via QR/least squares |
| MASS | Box-Cox, glm.nb | grid Box-Cox; NB via IRLS |
| emmeans/multcomp | médias marginais, letras (cld) | contrastes a partir dos coef. + atribuição de letras |
| hnp | envelope GLM | simulação de envelope (quantis) |
| agricolae | Kruskal, Duncan, SNK | rank-sum + equivalentes |
| statmod | Tweedie | MLE Tweedie (fase C) |
| lme4/nlme | mistos | fase C (mais complexo) |
| officer | PPTX | **pptxgenjs** |
| readxl/openxlsx | xlsx | **exceljs** |
| ggplot2 | gráficos | plotly.js / D3 |
| Scott-Knott (src/sk) | letras SK | port do clustering hierárquico de médias |

## Relatório PPTX
`scripts/gerar_apresentacao_pptx.R` usa **officer** (slides 13,33"×7,5", capa, visão geral, rotas, tabelas via flextable, gráficos). Port: **pptxgenjs**, espelhando `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx`.

## Formato de planilha (entrada)
Colunas: Tratamento/Fator1, Bloco (DBC), Fator2 (quali/quanti), Variável-resposta (numérica, pode ter NA), Local (conjunta), Covariável, Efeito aleatório. Import: normalizar nomes/níveis, coerção de tipo, validar mapeamento.

## Plano de port faseado (com golden tests)
- **Fase A (MVP analítico):** pressupostos (Bartlett) + ANOVA DIC/DBC 1 fator + LSD + tabela de médias/letras. ✅
- **Fase B (em curso):** ✅ **Tukey (HSD)** e **Scott-Knott** — amplitude estudentizada `ptukey`/`qtukey` (Gauss-Legendre, espelha o R), Tukey-Kramer p/ n desigual, SK recursivo (λ ~ χ², ν=g/(π−2)); **default Tukey** como no SAGRE; seletor de método na API/UI (`?metodo=`). _Validado vs tabela de Tukey._ ✅ **split-plot (2 erros)** (`anovaSplitPlot`). ✅ **fatorial 2–3 fatores (quali×quali) + desdobramento** (`anovaFatorial`, erro único; desdobra interação dupla em efeitos simples; balanceado ⇒ Type I = Type II). **Pendente:** desdobramento da interação tripla, transformações, não-paramétrico (Kruskal, Friedman + post-hoc), e **golden vs SAGRE** (rodar no R e comparar com tolerância — falta o ambiente R).
- **Fase C:** GLM auto-família + HNP, conjunta multi-local, 3 fatores, split-plot, mistos, Tweedie.

## Riscos
- **Divergência numérica** vs SAGRE (Type II SS, GLM, Box-Cox, SK) — mitigar com tolerância documentada e fixtures reais. Se a fidelidade de GLM/mistos custar demais, reconsiderar microserviço R **apenas** para essas rotas (decisão reaberta caso a caso).

## Arquivos-chave do SAGRE (para consulta no port)
`R/runExperiment.R` (dispatcher), `R/one_factor/runOneFactorQuali.R`, `R/helpers/rota.R`, `R/helpers/glm_engine.R`, `R/helpers/pressupostos.R`, `R/one_factor/runOneFactorNaoParam.R`, `R/one_factor/runOneFactorConjunta.R`, `src/sk/R/sk_glm.R`, `scripts/gerar_apresentacao_pptx.R`, `modules/mod_etapa7_resultados.R`.

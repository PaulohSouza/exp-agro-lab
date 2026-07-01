# Golden tests vs SAGRE

Valida a estatística portada em `packages/analytics` contra a **engine real do
SAGRE** (`ExpDes.pt`), usando **dados reais** das planilhas de teste do
SAGRE-app.

## Como funciona

- `gen-reference.R` — lê as planilhas do SAGRE-app (`BD/dados/*.xlsx`), copia os
  dados como CSV em `data/` e grava `reference.json` com a ANOVA de referência
  (GL/SQ/QM/F/p), CV, GL e QM do resíduo. A referência sai de `aov()` (Type I),
  que em designs balanceados coincide com o SAGRE — cruzado com
  `ExpDes.pt::fat3.dbc` à última casa decimal.
- `data/*.csv` + `reference.json` são **versionados**. A CI **não** roda R —
  `src/golden.test.ts` só carrega o JSON e compara o TS contra ele.

## Regenerar a referência

Precisa de R (≥4) com `readxl`, `jsonlite` e `ExpDes.pt`, e das planilhas do
SAGRE-app. O caminho dos dados vem do 1º argumento ou de `$SAGRE_DADOS`:

```bash
Rscript packages/analytics/golden/gen-reference.R "/caminho/para/sagre-app/BD/dados"
```

Depois rode `pnpm --filter @exp/analytics test golden` para conferir.

## Cobertura atual (batches 1–3)

| caso | delineamento | função TS | o que valida |
|---|---|---|---|
| `1fator_dbc_6trat` | DBC 1 fator | `anovaUmFator` | ANOVA + CV + **médias/letras Tukey** (vs `agricolae::HSD.test`) |
| `1fator_dic_grupo` | DIC 1 fator | `anovaUmFator` | ANOVA + CV + médias/letras Tukey |
| `fatorial_dbc_3x4` | DBC fatorial 2 | `anovaFatorial` | ANOVA + CV |
| `trifatorial_dbc_3x3x2` | DBC fatorial 3 | `anovaFatorial` | ANOVA + CV |
| `trifatorial_triplasig_3x3x2` | DBC fatorial 3 (tripla signif.) | `anovaFatorial` | ANOVA + CV |
| `split_dbc_3x4` | DBC split-plot | `anovaSplitPlot` | ANOVA **2 erros** + CV1/CV2 (vs `psub2.dbc` / `aov(Error)`) |
| `kruskal_grupo` | DIC (não-param.) | `kruskalWallis` | H, gl, p (vs `kruskal.test`) |
| `friedman_6trat` | DBC (não-param.) | `friedman` | χ², gl, p (vs `friedman.test`) |
| `transf_6trat` | DBC + transformação | `boxCoxLambda` / `aplicarTransformacao` | λ (vs `MASS::boxcox`) + ANOVA na escala √/log (vs `aov`) |

Cada caso de ANOVA roda para todas as variáveis-resposta da planilha.

**A fazer:** conjunta multi-local (G×A) — **falta dado**: nenhuma planilha do
SAGRE-app tem >1 local; médias/letras em fatorial; assertions no nível do
desdobramento (duplo/triplo). O desdobramento triplo já tem golden unitário no
PR #21 e casa com `fat3.dbc`.

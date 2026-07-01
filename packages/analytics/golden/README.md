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

## Cobertura atual (batch 1)

| caso | delineamento | função TS |
|---|---|---|
| `1fator_dbc_6trat` | DBC 1 fator | `anovaUmFator` |
| `fatorial_dbc_3x4` | DBC fatorial 2 | `anovaFatorial` |
| `trifatorial_dbc_3x3x2` | DBC fatorial 3 | `anovaFatorial` |
| `trifatorial_triplasig_3x3x2` | DBC fatorial 3 (tripla signif.) | `anovaFatorial` |

Cada caso roda para todas as variáveis-resposta da planilha.

**A fazer:** DIC, split-plot, transformações, não-paramétrico, conjunta,
comparação de médias (letras), e assertions no nível do desdobramento.

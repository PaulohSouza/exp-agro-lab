# Testes e2e (Playwright Python)

Testes de ponta a ponta contra a web (`:3000`) e a API (`:3001`). Há **13 suites**. O job e2e do CI roda **7** delas (marcadas abaixo); as de analytics servem para regressão local.

## Pré-requisitos
```bash
playwright install chromium     # 1ª vez (baixa o browser)
# API e web no ar (ver ../TESTES.md / ../README.md):
pnpm --filter @exp/api db:seed && node apps/api/dist/main.js   # :3001
pnpm --filter @exp/web dev                                     # :3000
```
Os testes usam o login demo `admin@demo.com` / `admin123`.

## Suites

| Suite | CI | O que cobre |
|---|---|---|
| `test_catalogo.py` | ✅ | Catálogo: login, gating de escopo, criar/excluir modelo |
| `test_catalogo_a5.py` | ✅ | "Adicionar do catálogo" + auto-inclusão de pré-requisito |
| `test_atividades.py` | ✅ | Catálogo de atividades + apontamento no experimento |
| `test_grupos.py` | ✅ | Grupos de coleta + aplicar grupo |
| `test_periodo_marcos.py` | ✅ | Tipo de período + gerar/confirmar marcos |
| `test_auth_refresh.py` | ✅ | Refresh-token (rotação + reuso) |
| `test_avaliacao_documental.py` | ✅ | Natureza FOTO/TEXTO, upload, exclusão da ANOVA |
| `test_pontos_amostrais.py` | local | M1: análise agrega N amostras/parcela (só API) |
| `test_split_plot.py` | local | Croqui + ANOVA de 2 erros |
| `test_fatorial.py` | local | ANOVA fatorial + desdobramento |
| `test_transformacao.py` | local | √ / log / Box-Cox |
| `test_naoparametrico.py` | local | Kruskal-Wallis |
| `test_conjunta.py` | local | Análise conjunta G×A |

## Rodar
```bash
python3 e2e/test_catalogo.py
# ou o loop do CI:
for t in test_catalogo test_catalogo_a5 test_atividades test_grupos test_periodo_marcos test_auth_refresh test_avaliacao_documental; do
  python3 "e2e/$t.py"
done
```
Saída termina em `PASSOU ✅` (exit 0) ou `FALHOU ❌` (exit 1).

## Notas
- `test_pontos_amostrais.py` roda **só via API** (não precisa da web em `:3000`): regressão de M1 — a análise agrega as N amostras por parcela (ex.: 5 plantas) antes da ANOVA, sem pseudorreplicar nem quebrar o balanceamento de fatorial/split.
- Os testes são **auto-limpantes** (removem o que criam) para não poluir o banco dev.
- `test_catalogo_a5.py` espera os modelos demo no catálogo (Produtividade com pré-requisito Umidade) e usa a experiência "SIM 2-Fatores".
- Seletores estáveis via `data-testid` (`modelo-nome`, `modelo-escopo`, `modelo-salvar`, `add-catalogo-select`, `add-catalogo-btn`, `add-catalogo-msg`).

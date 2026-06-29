# Testes e2e (Playwright Python)

Testes de ponta a ponta da UI, rodando contra a web (`:3000`) e a API (`:3001`).

## Pré-requisitos
```bash
playwright install chromium     # 1ª vez (baixa o browser)
# API e web no ar (ver ../TESTES.md):
pnpm --filter @exp/api db:seed && node apps/api/dist/main.js   # :3001
pnpm --filter @exp/web dev                                     # :3000
```
Os testes usam o login demo `admin@demo.com / admin123`.

## Rodar
```bash
python3 e2e/test_catalogo.py      # catálogo: login, gating de escopo, criar/excluir modelo
python3 e2e/test_catalogo_a5.py   # A5: "Adicionar do catálogo" + auto-inclusão de pré-requisito
```
Saída termina em `PASSOU ✅` (exit 0) ou `FALHOU ❌` (exit 1).

## Notas
- Os testes são **auto-limpantes** (removem o que criam) para não poluir o banco dev.
- `test_catalogo_a5.py` espera os modelos demo no catálogo (Produtividade com pré-requisito Umidade) e usa a experiência "SIM 2-Fatores".
- Seletores estáveis via `data-testid` (`modelo-nome`, `modelo-escopo`, `modelo-salvar`, `add-catalogo-select`, `add-catalogo-btn`, `add-catalogo-msg`).

#!/usr/bin/env python3
"""
Teste e2e da integração A5: "Adicionar do catálogo" na aba Avaliações, com
auto-inclusão de pré-requisitos (Produtividade → Umidade).

Pré: API :3001 + web :3000 no ar, e o catálogo com os modelos demo
(Produtividade com pré-requisito Umidade). Usa a experiência vazia
"SIM 2-Fatores" e remove as avaliações criadas ao final (auto-limpante).
"""
import sys
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
EXPERIMENTO = "SIM 2-Fatores"


def drena(page, name, exact=False):
    """Remove deterministicamente todos os botões com esse nome (espera a contagem cair)."""
    botoes = page.get_by_role("button", name=name, exact=exact)
    n = botoes.count()
    while n > 0:
        botoes.first.click()
        expect(botoes).to_have_count(n - 1)
        n -= 1


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(15000)
        page.on("dialog", lambda d: d.accept())

        # login
        page.goto(f"{BASE}/login")
        page.locator('input[type="email"]').fill("admin@demo.com")
        page.locator('input[type="password"]').fill("admin123")
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/experimentos")

        # abre a experiência (link "abrir →" na linha do experimento) e a aba Avaliações
        page.locator("tr", has_text=EXPERIMENTO).get_by_role("link", name="abrir").click()
        page.wait_for_url("**/experimentos/**")
        page.get_by_role("button", name="Avaliações").click()
        print("✓ aba Avaliações aberta")

        # sigla de escopo nas opções (ex.: "[GER] Produtividade")
        sel = page.locator('[data-testid="add-catalogo-select"]')
        expect(sel).to_be_visible()
        opt_prod = sel.locator("option", has_text="Produtividade").first
        assert "[" in (opt_prod.inner_text()), "faltou a sigla de escopo na opção"
        print(f"✓ sigla de escopo na opção: {opt_prod.inner_text().strip()}")

        # filtro por escopo (Geral/sistema) mantém Produtividade visível
        page.get_by_label("Filtrar por escopo").select_option("SISTEMA")
        value = sel.locator("option", has_text="Produtividade").first.get_attribute("value")
        assert value, "Produtividade (sistema) não está no catálogo"
        sel.select_option(value)
        print("✓ filtro por escopo aplicado")

        # modal de metodologia
        page.get_by_role("button", name="Ver metodologia").click()
        expect(page.get_by_text("Metodologia (relatório)")).to_be_visible()
        expect(page.get_by_text("Pontos amostrais")).to_be_visible()
        page.get_by_role("button", name="Fechar").click()
        print("✓ modal de metodologia abriu e fechou")

        page.locator('[data-testid="add-catalogo-btn"]').click()

        # aviso deve mencionar a auto-inclusão de Umidade (pré-requisito)
        msg = page.locator('[data-testid="add-catalogo-msg"]')
        expect(msg).to_contain_text("Umidade")
        print(f"✓ adicionar do catálogo OK — aviso: {msg.inner_text()}")

        # verifica as duas avaliações na tabela
        expect(page.locator("tr", has_text="Produtividade")).to_be_visible()
        expect(page.locator("tr", has_text="Umidade")).to_be_visible()
        print("✓ Produtividade + Umidade listadas")

        # limpeza: remove todas as avaliações criadas (botão "x", sem confirm)
        drena(page, "x", exact=True)
        # e as atividades que a Produtividade possa ter puxado (aba Atividades)
        page.get_by_role("button", name="Atividades", exact=True).click()
        page.wait_for_load_state("networkidle")
        drena(page, "excluir")
        print("✓ avaliações e atividades removidas (limpeza)")

        browser.close()
    print("\nA5 e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except Exception as e:  # noqa: BLE001
        print(f"\nFALHOU ❌: {e}")
        sys.exit(1)

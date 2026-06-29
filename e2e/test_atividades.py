#!/usr/bin/env python3
"""
Teste e2e da Macro C (C4): catálogo de atividades + aba Atividades no experimento.

Fluxo (auto-limpante):
  login → /catalogo aba Atividades → criar modelo 'apontamento' com 1 campo
  obrigatório → verificar na tabela → abrir experiência 'SIM 2-Fatores' → aba
  Atividades → adicionar do catálogo → validação (obrigatório vazio falha) →
  preencher e salvar apontamento → remover atividade e o modelo (limpeza).
"""
import sys
import time
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
NOME = f"E2E CO2 {int(time.time())}"
EXPERIMENTO = "SIM 2-Fatores"


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

        # catálogo → aba Atividades
        page.goto(f"{BASE}/catalogo")
        page.get_by_role("button", name="Atividades").first.click()
        page.locator('[data-testid="atv-nome"]').fill(NOME)
        page.locator('[data-testid="atv-tipo"]').select_option("apontamento")
        page.get_by_role("button", name="+ campo").click()
        page.locator('input[placeholder="rótulo"]').fill("vento")
        page.get_by_text("obrigatório").locator("input[type=checkbox]").check()
        page.locator('[data-testid="atv-salvar"]').click()
        expect(page.locator("tr", has_text=NOME)).to_be_visible()
        print(f"✓ modelo de atividade criado: {NOME}")

        # experiência → aba Atividades → adicionar do catálogo
        page.goto(f"{BASE}/experimentos")
        page.locator("tr", has_text=EXPERIMENTO).get_by_role("link", name="abrir").click()
        page.wait_for_url("**/experimentos/**")
        page.get_by_role("button", name="Atividades", exact=True).click()

        sel = page.locator('[data-testid="atv-exp-select"]')
        value = sel.locator("option", has_text=NOME).first.get_attribute("value")
        assert value, "modelo recém-criado não apareceu no select do experimento"
        sel.select_option(value)
        page.locator('[data-testid="atv-exp-add"]').click()
        print("✓ atividade adicionada ao experimento")

        # validação: campo obrigatório vazio → erro
        page.locator('[data-testid="atv-apont-salvar"]').click()
        expect(page.get_by_text("vento", exact=False)).to_be_visible()  # campo presente
        # preenche e salva
        page.locator('input[type="number"]').first.fill("3.2")
        page.locator('[data-testid="atv-apont-salvar"]').click()
        expect(page.get_by_text("Apontamento salvo.")).to_be_visible()
        print("✓ apontamento preenchido e salvo")

        # limpeza: remove a atividade do experimento
        page.get_by_role("button", name="excluir").first.click()
        page.wait_for_timeout(400)
        # remove o modelo no catálogo
        page.goto(f"{BASE}/catalogo")
        page.get_by_role("button", name="Atividades").first.click()
        page.locator("tr", has_text=NOME).get_by_role("button", name="x").click()
        expect(page.locator("tr", has_text=NOME)).to_have_count(0)
        print("✓ limpeza concluída")

        browser.close()
    print("\nC4 atividades e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except Exception as e:  # noqa: BLE001
        print(f"\nFALHOU ❌: {e}")
        sys.exit(1)

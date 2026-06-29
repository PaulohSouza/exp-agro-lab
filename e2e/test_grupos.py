#!/usr/bin/env python3
"""
Teste e2e da Macro B: grupos de coleta (CRUD no catálogo) + aplicar grupo +
coleta em lote (grade). Auto-limpante.
"""
import sys
import time
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
NOME = f"E2E Grupo {int(time.time())}"
EXPERIMENTO = "SIM 2-Fatores"


def drena(page, name, exact=False):
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

        page.goto(f"{BASE}/login")
        page.locator('input[type="email"]').fill("admin@demo.com")
        page.locator('input[type="password"]').fill("admin123")
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/experimentos")

        # catálogo → Grupos de coleta → criar grupo com 1 avaliação
        page.goto(f"{BASE}/catalogo")
        page.get_by_role("button", name="Grupos de coleta").click()
        page.locator('[data-testid="grupo-nome"]').fill(NOME)
        picker = page.locator('[data-testid="grupo-modelos"]')
        opt = picker.locator("option").nth(1)  # 1ª avaliação real
        picker.select_option(opt.get_attribute("value"))
        page.locator('[data-testid="grupo-salvar"]').click()
        expect(page.locator("tr", has_text=NOME)).to_be_visible()
        print(f"✓ grupo criado: {NOME}")

        # aplicar o grupo demo de sistema no experimento
        page.goto(f"{BASE}/experimentos")
        page.locator("tr", has_text=EXPERIMENTO).get_by_role("link", name="abrir").click()
        page.wait_for_url("**/experimentos/**")
        page.get_by_role("button", name="Avaliações", exact=True).click()
        page.wait_for_load_state("networkidle")
        sel = page.locator('[data-testid="aplicar-grupo-select"]')
        expect(sel).to_be_visible()
        # escolhe o grupo demo "Colheita (...)"
        val = sel.locator("option", has_text="Colheita").first.get_attribute("value")
        assert val, "grupo demo 'Colheita' não encontrado"
        sel.select_option(val)
        page.locator('[data-testid="aplicar-grupo-btn"]').click()
        expect(page.get_by_text("Grupo aplicado", exact=False)).to_be_visible()
        print("✓ grupo aplicado ao experimento")

        # abre a grade de coleta em lote
        page.get_by_role("button", name="Coleta em lote (grade)").click()
        expect(page.get_by_text("Coleta em lote", exact=False)).to_be_visible()
        print("✓ grade de coleta em lote abriu")
        page.get_by_role("button", name="← voltar").click()

        # limpeza: remove avaliações (x) e atividades (excluir)
        page.wait_for_load_state("networkidle")
        drena(page, "x", exact=True)
        page.get_by_role("button", name="Atividades", exact=True).click()
        page.wait_for_load_state("networkidle")
        drena(page, "×")
        drena(page, "excluir")
        # remove o grupo de teste do catálogo
        page.goto(f"{BASE}/catalogo")
        page.get_by_role("button", name="Grupos de coleta").click()
        page.locator("tr", has_text=NOME).get_by_role("button", name="x").click()
        expect(page.locator("tr", has_text=NOME)).to_have_count(0)
        print("✓ limpeza concluída")

        browser.close()
    print("\nMacro B (grupos+lote) e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except Exception as e:  # noqa: BLE001
        print(f"\nFALHOU ❌: {e}")
        sys.exit(1)

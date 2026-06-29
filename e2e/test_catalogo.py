#!/usr/bin/env python3
"""
Teste e2e do Catálogo de avaliações (Macro A) com Playwright (Python).

Pré: API em :3001 e web em :3000 no ar (ver TESTES.md).
Uso:  playwright install chromium   # 1ª vez
      python3 e2e/test_catalogo.py

Cobre: login → /catalogo → gating de escopo por papel → criar modelo →
verificar na tabela → excluir (auto-limpante, não polui o banco).
"""
import sys
import time
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
NOME = f"E2E Estande {int(time.time())}"


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(15000)

        # 1) login (admin = gestão da instituição)
        page.goto(f"{BASE}/login")
        page.locator('input[type="email"]').fill("admin@demo.com")
        page.locator('input[type="password"]').fill("admin123")
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/experimentos")
        print("✓ login OK")

        # 2) catálogo (aba Avaliações ativa por padrão)
        page.goto(f"{BASE}/catalogo")
        expect(page.get_by_role("heading", name="Catálogo")).to_be_visible()
        expect(page.locator('[data-testid="modelo-nome"]')).to_be_visible()
        print("✓ /catalogo carregou")

        # 3) gating de escopo: admin da instituição NÃO pode criar escopo 'sistema'
        opcoes = page.locator('[data-testid="modelo-escopo"] option').all_inner_texts()
        assert "Geral (sistema)" not in opcoes, f"escopo sistema não deveria aparecer: {opcoes}"
        assert any("Instituição" in o for o in opcoes), f"faltou escopo instituição: {opcoes}"
        print(f"✓ gating de escopo OK (opções: {opcoes})")

        # 4) criar modelo (escopo instituição)
        page.locator('[data-testid="modelo-nome"]').fill(NOME)
        page.locator('[data-testid="modelo-escopo"]').select_option("instituicao")
        page.locator('[data-testid="modelo-salvar"]').click()

        # 5) aparece na tabela
        linha = page.locator("tr", has_text=NOME)
        expect(linha).to_be_visible()
        print(f"✓ modelo criado e listado: {NOME}")

        # 6) excluir (confirm) — auto-limpeza
        page.on("dialog", lambda d: d.accept())
        linha.get_by_role("button", name="x").click()
        expect(page.locator("tr", has_text=NOME)).to_have_count(0)
        print("✓ modelo excluído (limpeza)")

        browser.close()
    print("\nTODOS OS TESTES PASSARAM ✅")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except Exception as e:  # noqa: BLE001
        print(f"\nFALHOU ❌: {e}")
        sys.exit(1)

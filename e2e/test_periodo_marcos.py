#!/usr/bin/env python3
"""
Teste e2e: Período (Safra/Ano.semestre) + Cronograma de marcos.

Fluxo (auto-limpante):
  login → experiência → Geral: trocar período p/ Ano.semestre 2026.1 e salvar →
  Atividades: gerar marcos → confirmar um marco (previsão + checkbox) →
  remover os marcos e restaurar o período para Safra.
"""
import sys
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
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

        page.locator("tr", has_text=EXPERIMENTO).get_by_role("link", name="abrir").click()
        page.wait_for_url("**/experimentos/**")

        # Geral: período → Ano.semestre 2026.1
        page.get_by_role("button", name="Geral", exact=True).click()
        periodo = page.locator("select").filter(has=page.locator('option[value="ANO_SEMESTRE"]'))
        periodo.select_option("ANO_SEMESTRE")
        page.get_by_placeholder("ex.: 2026.1").fill("2026.1")
        page.get_by_role("button", name="Salvar Geral").click()
        expect(page.get_by_text("Geral salvo.")).to_be_visible()
        print("✓ período Ano.semestre salvo")

        # Atividades: gerar marcos
        page.get_by_role("button", name="Atividades", exact=True).click()
        page.wait_for_load_state("networkidle")
        drena(page, "×")  # limpa marcos pré-existentes
        page.get_by_role("button", name="Gerar marcos").click()
        expect(page.get_by_text("Implantação", exact=False)).to_be_visible()
        expect(page.get_by_text("Encerramento", exact=False)).to_be_visible()
        print("✓ marcos gerados (Implantação/Início/Encerramento)")

        # confirma o primeiro marco: previsão + checkbox
        page.locator('input[type="date"]').first.fill("2026-07-15")
        page.locator('input[type="checkbox"]').first.check()
        expect(page.get_by_text("confirmado", exact=False).first).to_be_visible()
        print("✓ marco confirmado")

        # limpeza: remove marcos e restaura período
        page.wait_for_load_state("networkidle")
        drena(page, "×")
        page.get_by_role("button", name="Geral", exact=True).click()
        periodo = page.locator("select").filter(has=page.locator('option[value="ANO_SEMESTRE"]'))
        periodo.select_option("SAFRA")
        page.get_by_role("button", name="Salvar Geral").click()
        expect(page.get_by_text("Geral salvo.")).to_be_visible()
        print("✓ limpeza (marcos removidos, período restaurado)")

        browser.close()
    print("\nPeríodo+Marcos e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except Exception as e:  # noqa: BLE001
        print(f"\nFALHOU ❌: {e}")
        sys.exit(1)

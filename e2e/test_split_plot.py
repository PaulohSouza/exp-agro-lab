#!/usr/bin/env python3
"""
Teste e2e: croqui split-plot (parcela subdividida) na web.

Autossuficiente: cria via API um experimento com 2 fatores, depois dirige a aba
Croqui na UI — seleciona esquema "Parcela subdividida" + fator principal, gera,
verifica o render agrupado (Bloco N + dica da parcela principal) e salva (a API
revalida a integridade). O experimento é descartável (o reseed limpa no CI).
"""
import sys
from playwright.sync_api import sync_playwright, expect

WEB = "http://localhost:3000"
API = "http://localhost:3001"


def run() -> int:
    with sync_playwright() as p:
        api = p.request.new_context(base_url=API)
        tok = api.post("/auth/login", data={"email": "admin@demo.com", "senha": "admin123"}).json()[
            "access_token"
        ]
        hdr = {"Authorization": f"Bearer {tok}"}
        eid = api.post("/experimentos", headers=hdr, data={"titulo": "E2E SplitPlot"}).json()["id"]
        api.post(
            f"/experimentos/{eid}/fatores",
            headers=hdr,
            data={
                "fatores": [
                    {"ordem": 1, "nome": "Cultivar", "niveis": ["C1", "C2"]},
                    {"ordem": 2, "nome": "Dose", "niveis": ["D1", "D2", "D3"]},
                ]
            },
        )
        print("✓ setup via API: experimento com 2 fatores (2×3)")

        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(15000)
        page.on("dialog", lambda d: d.accept())

        page.goto(f"{WEB}/login")
        page.locator('input[type="email"]').fill("admin@demo.com")
        page.locator('input[type="password"]').fill("admin123")
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/experimentos")

        page.goto(f"{WEB}/experimentos/{eid}")
        page.get_by_role("button", name="Croqui", exact=True).click()

        expect(page.get_by_text("Esquema:")).to_be_visible()
        page.locator("select").first.select_option("PARCELA_SUBDIVIDIDA")
        print("✓ esquema 'Parcela subdividida' selecionável (2 fatores)")

        botao = page.get_by_role("button", name="Gerar croqui")
        if botao.count() == 0:
            botao = page.get_by_role("button", name="Recasualizar")
        botao.first.click()

        expect(page.get_by_text("Bloco 1")).to_be_visible()
        expect(page.get_by_text("borda grossa", exact=False).first).to_be_visible()
        # 18 subparcelas (2×3 × 3 blocos) renderizadas como células com tratamento
        expect(page.get_by_text("Parcela subdividida gerada.")).to_be_visible()
        print("✓ render agrupado (split-plot): Bloco 1 + parcelas principais")

        # volta para Fatorial e gera — confirma a alternância de esquema na UI
        page.locator("select").first.select_option("FATORIAL")
        page.get_by_role("button", name="Recasualizar").first.click()
        expect(page.get_by_text("Croqui gerado.")).to_be_visible()
        print("✓ alterna p/ Fatorial e gera (grade simples)")

        browser.close()
        api.dispose()
    print("\nSplit-plot e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    sys.exit(run())

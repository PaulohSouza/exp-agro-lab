#!/usr/bin/env python3
"""
Teste e2e: análise não-paramétrica (Kruskal-Wallis) na aba Análise.

Cria via API um experimento DIC com 4 tratamentos separados, verifica pela API
o teste de Kruskal-Wallis (H, p, médias de rank + letras de Dunn) e confere o
seletor de teste + render na web. Descartável (reseed limpa).
(Friedman é coberto pelos golden tests do analytics — requer DBC com cadastro
de delineamento, fora do escopo deste e2e.)
"""
import sys
from playwright.sync_api import sync_playwright, expect

WEB = "http://localhost:3000"
API = "http://localhost:3001"

BASE = {1: 10, 2: 20, 3: 30, 4: 40}
NO = [-1, 0, 1, 2, -2]


def run() -> int:
    with sync_playwright() as p:
        api = p.request.new_context(base_url=API)
        tok = api.post("/auth/login", data={"email": "admin@demo.com", "senha": "admin123"}).json()[
            "access_token"
        ]
        hdr = {"Authorization": f"Bearer {tok}"}
        eid = api.post("/experimentos", headers=hdr, data={"titulo": "E2E NaoParam"}).json()["id"]
        api.post(
            f"/experimentos/{eid}/fatores",
            headers=hdr,
            data={"fatores": [{"ordem": 1, "nome": "Trat", "niveis": ["T1", "T2", "T3", "T4"]}]},
        )
        api.post(f"/experimentos/{eid}/croqui/gerar", headers=hdr, data={"blocos": 5})
        exp = api.get(f"/experimentos/{eid}", headers=hdr).json()
        ref = {t["id"]: t["numeroRef"] for t in exp["tratamentos"]}
        parcelas = exp["parcelas"]
        avid = api.post(
            f"/experimentos/{eid}/avaliacoes", headers=hdr, data={"nome": "Massa"}
        ).json()["id"]
        lanc = [
            {
                "avaliacaoId": avid,
                "parcelaId": pc["id"],
                "valorColetado": BASE[ref[pc["tratamentoId"]]] + NO[(pc["bloco"] - 1) % 5],
            }
            for pc in parcelas
        ]
        api.post(f"/experimentos/{eid}/coleta-lote", headers=hdr, data={"lancamentos": lanc})
        print("✓ setup via API: DIC 4 tratamentos × 5 reps")

        a = api.get(f"/avaliacoes/{avid}/analise?naoParametrico=true", headers=hdr).json()
        assert a["teste"] == "naoParametrico", a
        r = a["resultado"]
        assert r["metodo"] == "Kruskal-Wallis", r
        assert r["gl"] == 3 and r["H"] > 0 and r["significativo"], r
        assert r["postHoc"]["metodo"] == "Dunn", r
        # ordenação por rank: T4 maior, T1 menor; extremos com letras distintas
        porGrupo = {g["grupo"]: g for g in r["grupos"]}
        assert porGrupo["T4"]["mediaRank"] > porGrupo["T1"]["mediaRank"], r["grupos"]
        assert set(porGrupo["T4"]["letra"]) & set(porGrupo["T1"]["letra"]) == set(), r["grupos"]
        print("✓ API: Kruskal-Wallis (H, p, Dunn) + letras separam os extremos")

        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(15000)
        page.goto(f"{WEB}/login")
        page.locator('input[type="email"]').fill("admin@demo.com")
        page.locator('input[type="password"]').fill("admin123")
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/experimentos")

        page.goto(f"{WEB}/experimentos/{eid}")
        page.get_by_role("button", name="Avaliações", exact=True).click()
        page.get_by_role("button", name="Análise", exact=True).first.click()
        # alterna para o teste não-paramétrico (1º combobox = "Teste")
        page.get_by_role("combobox").first.select_option("np")
        expect(page.get_by_text("Kruskal-Wallis", exact=False).first).to_be_visible()
        expect(page.get_by_text("Médias de rank", exact=False)).to_be_visible()
        print("✓ web: seletor de teste + render Kruskal-Wallis (médias de rank)")

        browser.close()
        api.dispose()
    print("\nNão-paramétrico e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    sys.exit(run())

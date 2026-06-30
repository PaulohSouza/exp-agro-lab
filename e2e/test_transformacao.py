#!/usr/bin/env python3
"""
Teste e2e: transformações (raiz / log / Box-Cox) na análise.

Cria via API um experimento DIC com 4 tratamentos e dados de ruído
multiplicativo (variância ∝ média), verifica pela API que cada transformação
retorna metadados + médias retro-transformadas próximas das originais, e que o
Box-Cox estima um λ no interior da grade. Depois confere o seletor de
transformação + banner na aba Análise da web. Descartável (reseed limpa).
"""
import sys
from playwright.sync_api import sync_playwright, expect

WEB = "http://localhost:3000"
API = "http://localhost:3001"

BASE = {1: 5, 2: 10, 3: 20, 4: 40}
NOISE = [0.82, 0.95, 1.07, 1.18, 0.90, 1.12, 0.88, 1.05, 0.97, 1.15,
         0.80, 1.10, 0.93, 1.20, 1.02, 0.85, 1.08, 0.98, 1.13, 0.91]


def run() -> int:
    with sync_playwright() as p:
        api = p.request.new_context(base_url=API)
        tok = api.post("/auth/login", data={"email": "admin@demo.com", "senha": "admin123"}).json()[
            "access_token"
        ]
        hdr = {"Authorization": f"Bearer {tok}"}
        eid = api.post("/experimentos", headers=hdr, data={"titulo": "E2E Transf"}).json()["id"]
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
                "valorColetado": round(BASE[ref[pc["tratamentoId"]]] * NOISE[i % len(NOISE)], 3),
            }
            for i, pc in enumerate(parcelas)
        ]
        api.post(f"/experimentos/{eid}/coleta-lote", headers=hdr, data={"lancamentos": lanc})
        print("✓ setup via API: DIC 4 tratamentos × 5 reps (ruído multiplicativo)")

        base = api.get(f"/avaliacoes/{avid}/analise", headers=hdr).json()["resultado"]
        orig = {m["tratamento"]: m["media"] for m in base["medias"]}

        for tipo in ("raiz", "log", "boxcox"):
            a = api.get(f"/avaliacoes/{avid}/analise?transformacao={tipo}", headers=hdr).json()
            info = a["transformacao"]
            assert info and info["tipo"] == tipo, a
            # médias retro-transformadas próximas das originais (≤ 5%)
            for m in a["resultado"]["medias"]:
                o = orig[m["tratamento"]]
                assert abs(m["media"] - o) / o < 0.05, (tipo, m, o)
            if tipo == "boxcox":
                assert -2 < info["lambda"] < 2, info
                assert abs(info["lambda"] + 2) > 0.01 and abs(info["lambda"] - 2) > 0.01, info
        print("✓ API: raiz/log/Box-Cox com metadados + médias retro ≈ originais; λ no interior")

        # estabilização: o CV cai quando se aplica a transformação adequada
        cv0 = base["cv"]
        cvlog = api.get(f"/avaliacoes/{avid}/analise?transformacao=log", headers=hdr).json()[
            "resultado"
        ]["cv"]
        assert cvlog < cv0, (cv0, cvlog)
        print(f"✓ CV cai com a transformação (nenhuma={cv0:.1f}% → log={cvlog:.1f}%)")

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
        # seleciona log(x+1) e confirma o banner de escala transformada
        # comboboxes na ordem: [Teste, Transformação, Comparação]
        page.get_by_role("combobox").nth(1).select_option("log")
        expect(page.get_by_text("retro-transformadas", exact=False)).to_be_visible()
        print("✓ web: seletor de transformação + banner de escala transformada")

        browser.close()
        api.dispose()
    print("\nTransformações e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    sys.exit(run())

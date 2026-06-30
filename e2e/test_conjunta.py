#!/usr/bin/env python3
"""
Teste e2e: análise conjunta multi-local + seleção de rota (Shapiro-Wilk).

Cria via API 2 experimentos DBC (mesmos tratamentos), com efeito de local,
interação G×A e resíduo; verifica pela API o endpoint /analise/conjunta
(tabela Local/Tratamento/Local×Trat, GL, aditividade, F finitos, homogeneidade)
e que a análise 1-fator traz `rotaSugerida` (Shapiro). Depois confere a página
/analise-conjunta na web. Descartável (reseed limpa).
"""
import sys
from playwright.sync_api import sync_playwright, expect

WEB = "http://localhost:3000"
API = "http://localhost:3001"

BASE = {1: 30, 2: 36, 3: 42}
# perturbação por (bloco, índice de trat) — padrão tipo quadrado latino (não
# aditiva por bloco) → garante resíduo > 0.
NOISE = [[0, 1, -1], [1, -1, 0], [-1, 0, 1]]


def montar(api, hdr, titulo, offset, interacao):
    eid = api.post("/experimentos", headers=hdr, data={"titulo": titulo}).json()["id"]
    api.post(
        f"/experimentos/{eid}/fatores",
        headers=hdr,
        data={"fatores": [{"ordem": 1, "nome": "Cultivar", "niveis": ["T1", "T2", "T3"]}]},
    )
    api.post(f"/experimentos/{eid}/croqui/gerar", headers=hdr, data={"blocos": 3, "delineamento": "DBC"})
    exp = api.get(f"/experimentos/{eid}", headers=hdr).json()
    ref = {t["id"]: t["numeroRef"] for t in exp["tratamentos"]}
    avid = api.post(f"/experimentos/{eid}/avaliacoes", headers=hdr, data={"nome": "Massa"}).json()["id"]
    lanc = []
    for p in exp["parcelas"]:
        tr = ref[p["tratamentoId"]]
        v = BASE[tr] + offset + interacao.get(tr, 0) + NOISE[(p["bloco"] - 1) % 3][tr - 1]
        lanc.append({"avaliacaoId": avid, "parcelaId": p["id"], "valorColetado": v})
    api.post(f"/experimentos/{eid}/coleta-lote", headers=hdr, data={"lancamentos": lanc})
    return eid, avid


def run() -> int:
    with sync_playwright() as p:
        api = p.request.new_context(base_url=API)
        tok = api.post("/auth/login", data={"email": "admin@demo.com", "senha": "admin123"}).json()[
            "access_token"
        ]
        hdr = {"Authorization": f"Bearer {tok}"}
        a, avid = montar(api, hdr, "CONJ E2E Local A", 0, {})
        b, _ = montar(api, hdr, "CONJ E2E Local B", 8, {3: 3})  # G×A: T3 extra no local B
        print("✓ setup via API: 2 locais DBC (3 trat × 3 blocos), interação + resíduo")

        res = api.post(
            "/analise/conjunta",
            headers=hdr,
            data={"experimentoIds": [a, b], "avaliacaoNome": "Massa"},
        ).json()
        r = res["resultado"]
        assert r["metodo"] == "Conjunta" and r["locais"] == 2 and r["tratamentos"] == 3, r
        fontes = {l["fonte"]: l for l in r["tabela"]}
        for f in ["Local", "Bloco/Local", "Tratamento", "Local × Tratamento", "Resíduo", "Total"]:
            assert f in fontes, fontes.keys()
        # aditividade e GL
        partes = ["Local", "Bloco/Local", "Tratamento", "Local × Tratamento", "Resíduo"]
        soma = sum(fontes[f]["sq"] for f in partes)
        assert abs(soma - fontes["Total"]["sq"]) < 1e-6, (soma, fontes["Total"]["sq"])
        assert fontes["Tratamento"]["gl"] == 2 and fontes["Local × Tratamento"]["gl"] == 2
        # F do tratamento testado pela interação, finito (resíduo > 0)
        assert fontes["Resíduo"]["sq"] > 0, fontes["Resíduo"]
        import math

        assert math.isfinite(r["fTratamento"]["f"]), r["fTratamento"]
        assert isinstance(r["homogeneo"], bool)
        assert all("letra" in m for m in r["medias"])
        print("✓ API conjunta: tabela G×A, aditividade, F finito, homogeneidade")

        # rota sugerida (Shapiro-Wilk) na análise 1-fator
        an = api.get(f"/avaliacoes/{avid}/analise", headers=hdr).json()
        assert an.get("rotaSugerida"), an.keys()
        assert "W" in an["rotaSugerida"]["normalidade"], an["rotaSugerida"]
        assert an["rotaSugerida"]["rota"] in ("parametrica", "transformacao", "naoParametrico")
        print(f"✓ API rota sugerida: {an['rotaSugerida']['rota']} (Shapiro W={an['rotaSugerida']['normalidade']['W']:.3f})")

        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(15000)
        page.goto(f"{WEB}/login")
        page.locator('input[type="email"]').fill("admin@demo.com")
        page.locator('input[type="password"]').fill("admin123")
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/experimentos")

        page.goto(f"{WEB}/analise-conjunta")
        page.get_by_text("CONJ E2E Local A", exact=False).click()
        page.get_by_text("CONJ E2E Local B", exact=False).click()
        page.get_by_placeholder("ex.: Produtividade").fill("Massa")
        page.get_by_role("button", name="Analisar", exact=False).click()
        expect(page.get_by_text("Local × Tratamento", exact=False)).to_be_visible()
        expect(page.get_by_text("Razão QM-resíduo", exact=False)).to_be_visible()
        print("✓ web: página /analise-conjunta renderiza a ANOVA conjunta")

        browser.close()
        api.dispose()
    print("\nConjunta e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    sys.exit(run())

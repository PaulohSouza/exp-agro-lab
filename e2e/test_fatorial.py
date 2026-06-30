#!/usr/bin/env python3
"""
Teste e2e: ANOVA fatorial (erro único) + desdobramento da interação.

Autossuficiente: cria via API um experimento 2×2, gera o croqui FATORIAL,
lança valores com interação cruzada forte (sem efeitos principais), e verifica
pela API a tabela de erro único + desdobramento. Depois confere o render da aba
Análise na web. O experimento é descartável (o reseed limpa no CI).
"""
import sys
from playwright.sync_api import sync_playwright, expect

WEB = "http://localhost:3000"
API = "http://localhost:3001"

# combos (último fator varia mais rápido): T1=A1B1 T2=A1B2 T3=A2B1 T4=A2B2.
# interação cruzada: A1B1=A2B2=10, A1B2=A2B1=20 → efeitos principais ~nulos.
BASE = {1: 10, 2: 20, 3: 20, 4: 10}
RUIDO = [0.0, 1.0, -1.0, 2.0]  # por bloco, pequeno ante a interação de 10 unidades


def run() -> int:
    with sync_playwright() as p:
        api = p.request.new_context(base_url=API)
        tok = api.post("/auth/login", data={"email": "admin@demo.com", "senha": "admin123"}).json()[
            "access_token"
        ]
        hdr = {"Authorization": f"Bearer {tok}"}
        eid = api.post("/experimentos", headers=hdr, data={"titulo": "E2E Fatorial"}).json()["id"]
        api.post(
            f"/experimentos/{eid}/fatores",
            headers=hdr,
            data={
                "fatores": [
                    {"ordem": 1, "nome": "FatorA", "niveis": ["A1", "A2"]},
                    {"ordem": 2, "nome": "FatorB", "niveis": ["B1", "B2"]},
                ]
            },
        )
        api.post(
            f"/experimentos/{eid}/croqui/gerar",
            headers=hdr,
            data={"esquema": "FATORIAL", "blocos": 4},
        )
        print("✓ setup via API: experimento 2×2, croqui FATORIAL (4 reps)")

        exp = api.get(f"/experimentos/{eid}", headers=hdr).json()
        ref_de = {t["id"]: t["numeroRef"] for t in exp["tratamentos"]}
        parcelas = exp["parcelas"]
        assert len(parcelas) == 16, f"esperava 16 parcelas, veio {len(parcelas)}"

        avid = api.post(
            f"/experimentos/{eid}/avaliacoes", headers=hdr, data={"nome": "Massa"}
        ).json()["id"]

        lanc = []
        for pc in parcelas:
            ref = ref_de[pc["tratamentoId"]]
            valor = BASE[ref] + RUIDO[(pc["bloco"] - 1) % 4]
            lanc.append({"avaliacaoId": avid, "parcelaId": pc["id"], "valorColetado": valor})
        api.post(f"/experimentos/{eid}/coleta-lote", headers=hdr, data={"lancamentos": lanc})
        print("✓ 16 valores lançados (interação cruzada)")

        a = api.get(f"/avaliacoes/{avid}/analise", headers=hdr).json()
        assert a["esquema"] == "FATORIAL", a
        r = a["resultado"]
        fontes = {l["fonte"] for l in r["tabela"]}
        assert {"FatorA", "FatorB", "FatorA × FatorB", "Resíduo", "Total"} <= fontes, fontes
        # um único erro
        assert sum(1 for l in r["tabela"] if l["fonte"] == "Resíduo") == 1
        interacao = next(i for i in r["interacoes"] if i["fonte"] == "FatorA × FatorB")
        assert interacao["significativo"], interacao
        assert len(r["desdobramentos"]) == 2, r["desdobramentos"]
        descricoes = {d["descricao"] for d in r["desdobramentos"]}
        assert "FatorA dentro de cada nível de FatorB" in descricoes, descricoes
        # SQ(A/B) soma = SQ(A) + SQ(A×B)
        aDentroB = next(d for d in r["desdobramentos"] if d["fatorAlvo"] == "FatorA")
        soma_sq = sum(e["sq"] for e in aDentroB["efeitos"])
        sqA = next(l for l in r["tabela"] if l["fonte"] == "FatorA")["sq"]
        sqAB = next(l for l in r["tabela"] if l["fonte"] == "FatorA × FatorB")["sq"]
        assert abs(soma_sq - (sqA + sqAB)) < 1e-6, (soma_sq, sqA, sqAB)
        print("✓ API: erro único, interação signif., desdobramento consistente")

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
        expect(page.get_by_text("ANOVA fatorial", exact=False)).to_be_visible()
        expect(page.get_by_text("Desdobramento da interação")).to_be_visible()
        print("✓ web: aba Análise renderiza ANOVA fatorial + desdobramento")

        browser.close()
        api.dispose()
    print("\nFatorial e2e PASSOU ✅")
    return 0


if __name__ == "__main__":
    sys.exit(run())

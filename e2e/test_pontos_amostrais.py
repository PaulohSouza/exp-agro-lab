#!/usr/bin/env python3
"""
Teste e2e (só API): pontos amostrais (N amostras por parcela).

Regressão de M1 (MELHORIAS.md): a UNIDADE EXPERIMENTAL é a parcela. Quando há
várias amostras por parcela (ex.: 5 plantas), a análise deve AGREGAR (média) por
parcela antes da ANOVA — senão pseudorreplicação (n/GL inflados) e quebra do
balanceamento de fatorial/split-plot.

Autossuficiente: cria os experimentos via API, lança 5 amostras por parcela e
verifica pela análise que n == nº de parcelas (não 5×). Descartável (reseed limpa no CI).
"""
import sys
from playwright.sync_api import sync_playwright

API = "http://localhost:3001"
PONTOS = 5


def run() -> int:
    with sync_playwright() as p:
        api = p.request.new_context(base_url=API)
        tok = api.post(
            "/auth/login", data={"email": "admin@demo.com", "senha": "admin123"}
        ).json()["access_token"]
        hdr = {"Authorization": f"Bearer {tok}"}

        # ---------- Caso 1: DIC 1 fator, 3 trat × 4 rep = 12 parcelas ----------
        eid = api.post(
            "/experimentos", headers=hdr, data={"titulo": "E2E Pontos amostrais (DIC)"}
        ).json()["id"]
        api.post(
            f"/experimentos/{eid}/fatores",
            headers=hdr,
            data={"fatores": [{"ordem": 1, "nome": "Trat", "niveis": ["A", "B", "C"]}]},
        )
        api.post(f"/experimentos/{eid}/croqui/gerar", headers=hdr, data={"blocos": 4})

        # avaliação com numeroPontos=5 (M2: settável em avaliação ad-hoc)
        av = api.post(
            f"/experimentos/{eid}/avaliacoes",
            headers=hdr,
            data={"nome": "Altura", "unidadeColeta": "cm", "numeroPontos": PONTOS},
        ).json()
        assert av["numeroPontos"] == PONTOS, f"numeroPontos não persistiu: {av}"
        avid = av["id"]

        exp = api.get(f"/experimentos/{eid}", headers=hdr).json()
        parcelas = exp["parcelas"]
        ref_de = {t["id"]: t["numeroRef"] for t in exp["tratamentos"]}
        assert len(parcelas) == 12, f"esperava 12 parcelas, veio {len(parcelas)}"

        # base por tratamento; as 5 amostras variam em torno da base da parcela
        base = {1: 90.0, 2: 100.0, 3: 110.0}
        lanc = []
        for pc in parcelas:
            b = base[ref_de[pc["tratamentoId"]]]
            for a in range(1, PONTOS + 1):
                lanc.append(
                    {
                        "avaliacaoId": avid,
                        "parcelaId": pc["id"],
                        "numeroAmostra": a,
                        "valorColetado": b + (a - 3),  # média por parcela == base
                    }
                )
        res = api.post(
            f"/experimentos/{eid}/coleta-lote", headers=hdr, data={"lancamentos": lanc}
        ).json()
        assert res["salvos"] == 12 * PONTOS, res
        print(f"✓ DIC: {res['salvos']} amostras ({len(parcelas)} parcelas × {PONTOS})")

        a = api.get(f"/avaliacoes/{avid}/analise", headers=hdr).json()
        assert a["n"] == len(parcelas), f"pseudorreplicação: n={a['n']} (esperava {len(parcelas)})"
        gl_res = next(l["gl"] for l in a["resultado"]["tabela"] if l["fonte"] == "Resíduo")
        assert gl_res == 12 - 3, f"GL resíduo errado: {gl_res} (esperava 9)"
        # média do tratamento == base (agregação por média das amostras)
        medias = {m["tratamento"]: m["media"] for m in a["resultado"]["medias"]}
        assert abs(medias["T2"] - 100.0) < 1e-6, medias
        print(f"✓ DIC: análise agrega por parcela → n={a['n']}, GLresíduo={gl_res}, médias corretas")

        # ---------- Caso 2: Fatorial 2×2 com 5 amostras NÃO quebra (balanceamento) ----------
        fid = api.post(
            "/experimentos", headers=hdr, data={"titulo": "E2E Pontos amostrais (Fatorial)"}
        ).json()["id"]
        api.post(
            f"/experimentos/{fid}/fatores",
            headers=hdr,
            data={
                "fatores": [
                    {"ordem": 1, "nome": "FatorA", "niveis": ["A1", "A2"]},
                    {"ordem": 2, "nome": "FatorB", "niveis": ["B1", "B2"]},
                ]
            },
        )
        api.post(
            f"/experimentos/{fid}/croqui/gerar",
            headers=hdr,
            data={"esquema": "FATORIAL", "blocos": 4},
        )
        favid = api.post(
            f"/experimentos/{fid}/avaliacoes",
            headers=hdr,
            data={"nome": "Altura", "numeroPontos": PONTOS},
        ).json()["id"]
        fexp = api.get(f"/experimentos/{fid}", headers=hdr).json()
        fparc = fexp["parcelas"]
        fref = {t["id"]: t["numeroRef"] for t in fexp["tratamentos"]}
        fbase = {1: 10.0, 2: 20.0, 3: 20.0, 4: 10.0}  # interação cruzada
        flanc = []
        for pc in fparc:
            b = fbase[fref[pc["tratamentoId"]]]
            for a in range(1, PONTOS + 1):
                flanc.append(
                    {
                        "avaliacaoId": favid,
                        "parcelaId": pc["id"],
                        "numeroAmostra": a,
                        "valorColetado": b + (a - 3) * 0.1,
                    }
                )
        api.post(f"/experimentos/{fid}/coleta-lote", headers=hdr, data={"lancamentos": flanc})
        fa = api.get(f"/avaliacoes/{favid}/analise", headers=hdr).json()
        assert fa["esquema"] == "FATORIAL", fa
        assert fa["n"] == len(fparc), f"fatorial pseudorreplicou: n={fa['n']} (esperava {len(fparc)})"
        print(f"✓ Fatorial: 5 amostras/parcela agora ANALISA (n={fa['n']}, sem erro de balanceamento)")

        print("PASSOU ✅")
        return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except AssertionError as e:
        print(f"FALHOU ❌  {e}")
        sys.exit(1)

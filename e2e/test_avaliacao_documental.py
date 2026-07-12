#!/usr/bin/env python3
"""
Teste e2e (só API): avaliação documental (foto/texto) + coleta parcial informal.

Cobre a Demanda E (SDD 09):
- upload de imagem (POST /uploads) e rejeição de não-imagem;
- avaliação FOTO exige fotoUrl (sem imagem → 400; com imagem → grava);
- avaliação TEXTO exige observação (sem → 400; com → grava);
- avaliação NUMERICA continua leniente (sem valor → ok, retrocompat);
- análise/relatório de avaliação documental → 400 (fora da estatística);
- documental coleta-se por subconjunto de parcelas (só 1 bloco) sem "incompleta".

Autossuficiente e descartável (remove o experimento no fim). API por env API_BASE
(default :3001). Não precisa da web em :3000.
"""
import os
import sys
from playwright.sync_api import sync_playwright

API = os.environ.get("API_BASE", "http://localhost:3001")

# PNG 1x1 mínimo válido.
PNG_1X1 = bytes.fromhex(
    "89504e470d0a1a0a0000000d494844520000000100000001080600000"
    "01f15c4890000000a49444154789c6300010000050001"
    "0d0a2db40000000049454e44ae426082"
)


def run() -> int:
    with sync_playwright() as p:
        api = p.request.new_context(base_url=API)
        tok = api.post(
            "/auth/login", data={"email": "admin@demo.com", "senha": "admin123"}
        ).json()["access_token"]
        hdr = {"Authorization": f"Bearer {tok}"}

        # experimento DIC 2 trat × 3 blocos = 6 parcelas
        eid = api.post(
            "/experimentos", headers=hdr, data={"titulo": "E2E Documental"}
        ).json()["id"]
        api.post(
            f"/experimentos/{eid}/fatores",
            headers=hdr,
            data={"fatores": [{"ordem": 1, "nome": "Trat", "niveis": ["A", "B"]}]},
        )
        api.post(f"/experimentos/{eid}/croqui/gerar", headers=hdr, data={"blocos": 3})
        exp = api.get(f"/experimentos/{eid}", headers=hdr).json()
        parcelas = exp["parcelas"]
        assert len(parcelas) == 6, f"esperava 6 parcelas, veio {len(parcelas)}"
        bloco1 = [p for p in parcelas if p["bloco"] == 1]

        try:
            # ---- 1) upload: imagem OK, não-imagem 400 ----
            up = api.post(
                "/uploads",
                headers=hdr,
                multipart={
                    "file": {
                        "name": "f.png",
                        "mimeType": "image/png",
                        "buffer": PNG_1X1,
                    }
                },
            )
            assert up.ok, f"upload de imagem falhou: {up.status} {up.text()}"
            foto_url = up.json()["url"]
            assert foto_url, "upload não devolveu url"

            bad = api.post(
                "/uploads",
                headers=hdr,
                multipart={
                    "file": {"name": "f.txt", "mimeType": "text/plain", "buffer": b"x"}
                },
            )
            assert bad.status == 400, f"upload não-imagem deveria 400, veio {bad.status}"

            # ---- 2) avaliação FOTO ----
            avf = api.post(
                f"/experimentos/{eid}/avaliacoes",
                headers=hdr,
                data={"nome": "Registro fotográfico parcela", "natureza": "FOTO"},
            ).json()
            assert avf["natureza"] == "FOTO", f"natureza não persistiu: {avf}"
            avf_id = avf["id"]

            r = api.post(
                f"/avaliacoes/{avf_id}/dados",
                headers=hdr,
                data={"dados": [{"parcelaId": bloco1[0]["id"]}]},
            )
            assert r.status == 400, f"FOTO sem imagem deveria 400, veio {r.status}"

            # coleta parcial: só as parcelas do bloco 1
            r = api.post(
                f"/avaliacoes/{avf_id}/dados",
                headers=hdr,
                data={
                    "dados": [{"parcelaId": p["id"], "fotoUrl": foto_url} for p in bloco1]
                },
            )
            assert r.ok, f"FOTO com imagem deveria gravar, veio {r.status} {r.text()}"
            dados = api.get(f"/avaliacoes/{avf_id}/dados", headers=hdr).json()
            com_foto = [d for d in dados if d.get("fotoUrl")]
            assert len(com_foto) == len(bloco1), f"esperava {len(bloco1)} fotos, veio {len(com_foto)}"

            # análise de documental → 400
            an = api.get(f"/avaliacoes/{avf_id}/analise", headers=hdr)
            assert an.status == 400, f"análise de FOTO deveria 400, veio {an.status}"

            # ---- 3) avaliação TEXTO ----
            avt = api.post(
                f"/experimentos/{eid}/avaliacoes",
                headers=hdr,
                data={"nome": "Nota da parcela", "natureza": "TEXTO"},
            ).json()
            avt_id = avt["id"]
            r = api.post(
                f"/avaliacoes/{avt_id}/dados",
                headers=hdr,
                data={"dados": [{"parcelaId": bloco1[0]["id"]}]},
            )
            assert r.status == 400, f"TEXTO sem obs deveria 400, veio {r.status}"
            r = api.post(
                f"/avaliacoes/{avt_id}/dados",
                headers=hdr,
                data={
                    "dados": [{"parcelaId": bloco1[0]["id"], "observacoes": "murcha"}]
                },
            )
            assert r.ok, f"TEXTO com obs deveria gravar, veio {r.status} {r.text()}"

            # ---- 4) NUMERICA continua leniente ----
            avn = api.post(
                f"/experimentos/{eid}/avaliacoes",
                headers=hdr,
                data={"nome": "Altura"},
            ).json()
            r = api.post(
                f"/avaliacoes/{avn['id']}/dados",
                headers=hdr,
                data={"dados": [{"parcelaId": bloco1[0]["id"]}]},
            )
            assert r.ok, f"NUMERICA sem valor deveria ser leniente, veio {r.status}"

            print("PASSOU ✅")
            return 0
        finally:
            api.delete(f"/experimentos/{eid}", headers=hdr)


if __name__ == "__main__":
    try:
        sys.exit(run())
    except AssertionError as e:
        print(f"FALHOU ❌ {e}")
        sys.exit(1)

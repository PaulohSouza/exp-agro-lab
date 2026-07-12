#!/usr/bin/env python3
"""
Teste e2e (só API): refresh-token (rotação + detecção de reuso) e senha forte.

Regressão do endurecimento (STATUS §8.5). Usa o usuário demo para o fluxo de
refresh (não cria instituição); senha forte é checada só via respostas 400.
"""
import sys
from playwright.sync_api import sync_playwright

API = "http://localhost:3001"


def run() -> int:
    with sync_playwright() as p:
        api = p.request.new_context(base_url=API)

        # login → access + refresh
        r = api.post("/auth/login", data={"email": "admin@demo.com", "senha": "admin123"})
        assert r.status == 201, r.status
        l = r.json()
        assert l.get("access_token") and l.get("refresh_token"), l
        rt1 = l["refresh_token"]
        print("✓ login retorna access_token + refresh_token")

        # refresh rotaciona (novo != antigo)
        r = api.post("/auth/refresh", data={"refresh_token": rt1})
        assert r.status == 201, (r.status, r.text())
        rt2 = r.json()["refresh_token"]
        assert rt2 and rt2 != rt1, "refresh não rotacionou"
        print("✓ /auth/refresh rotaciona o token")

        # reuso do token antigo → 401 e revoga a família (rt2 também cai)
        r = api.post("/auth/refresh", data={"refresh_token": rt1})
        assert r.status == 401, r.status
        r = api.post("/auth/refresh", data={"refresh_token": rt2})
        assert r.status == 401, "detecção de reuso deveria revogar a família (rt2)"
        print("✓ reuso de refresh revogado detecta e revoga a família")

        # senha forte: curta (Zod) e sem número (service)
        r = api.post(
            "/auth/register-instituicao",
            data={"instituicaoNome": "X", "adminNome": "Y", "adminEmail": "w@x.com", "adminSenha": "abc"},
        )
        assert r.status == 400, r.status
        r = api.post(
            "/auth/register-instituicao",
            data={"instituicaoNome": "X", "adminNome": "Y", "adminEmail": "w2@x.com", "adminSenha": "abcdefgh"},
        )
        assert r.status == 400 and "número" in r.text(), r.text()
        print("✓ senha forte rejeita curta e sem número")

        # logout revoga um refresh recém-emitido
        l2 = api.post("/auth/login", data={"email": "admin@demo.com", "senha": "admin123"}).json()
        assert api.post("/auth/logout", data={"refresh_token": l2["refresh_token"]}).status == 201
        r = api.post("/auth/refresh", data={"refresh_token": l2["refresh_token"]})
        assert r.status == 401, "refresh após logout deveria falhar"
        print("✓ logout revoga o refresh-token")

        print("PASSOU ✅")
        return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except AssertionError as e:
        print(f"FALHOU ❌  {e}")
        sys.exit(1)

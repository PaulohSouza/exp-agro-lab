# DEVELOPMENT — EXP-AGROLAB (monorepo)

Fundação do **Marco 0**. Monorepo TypeScript (pnpm + Turborepo).

## Estrutura
```
packages/domain   # núcleo puro: croqui, RN-PROD (cálculo), fluxo — testado (vitest)
apps/api          # NestJS + Prisma (MySQL) — health, e-mail (SIMULATE), seed
apps/web          # Next.js — shell inicial (lê /health da API)
apps/mobile       # placeholder (Marco 2: React Native offline-first)
```

## Pré-requisitos
- Node ≥ 20, pnpm 9 (`npm i -g pnpm`), MySQL 8 acessível.

## Banco (dev)
- Banco dedicado **`expagrolab_dev`** (instância MySQL local; **separado** do schema `sagre`).
- Usuário `expagrolab`. Configure `apps/api/.env` a partir de `apps/api/.env.example`
  (`DATABASE_URL` e `SHADOW_DATABASE_URL`). O `.env` real **não é versionado**.

## Subir do zero
```bash
pnpm install
pnpm --filter @exp/api exec prisma migrate dev   # aplica migrações
pnpm --filter @exp/api db:seed                    # cenário PC1699
pnpm --filter @exp/api build && node apps/api/dist/main.js   # API em :3001
pnpm --filter @exp/web dev                        # Web em :3000
```

## Subir via container (Docker)
Stack completo em containers (MySQL + API + Web) — não precisa de MySQL/Node no host.
```bash
docker compose up -d --build      # builda e sobe mysql + api(:3001) + web(:3000)
docker compose logs -f api        # acompanha migrate + seed + boot da API
# Web:  http://localhost:3000/login   (admin@demo.com / admin123)
docker compose down               # para tudo (use -v para apagar o volume do MySQL)
```
Notas:
- A API roda `prisma migrate deploy` + `db:seed` (idempotentes) no start; o seed traz o cenário **PC1699** + sandbox.
- O MySQL do container **não é exposto ao host** (evita conflito com o MySQL local); a API o acessa pela rede interna (`mysql:3306`).
- `NEXT_PUBLIC_API_BASE` é inlinado no build do Next apontando para `http://localhost:3001` (a API vista pelo navegador). Ajuste o build-arg se publicar em outro host.
- Para reproduzir experimentos de demonstração além do seed, rode um script de coleta contra `http://localhost:3001` (a API real).

## Comandos úteis (raiz)
```bash
pnpm test         # testes (domain) via turbo
pnpm typecheck    # typecheck de todos os pacotes
pnpm build        # build de todos
```

## Verificação rápida
```bash
curl localhost:3001/health
# {"status":"ok","db":"up",...}
curl -X POST localhost:3001/email/preview-aprovacao -H 'Content-Type: application/json' -d '{"para":"cliente@demo.com"}'
# gera HTML em apps/api/email-previews/ (modo SIMULATE — não envia)
```

## E-mail
- `SIMULATE_SEND=true` (default): renderiza o HTML em `apps/api/email-previews/` e grava `EmailLog`, **sem enviar**.
- `SIMULATE_SEND=false`: envia via SMTP (nodemailer) usando `EMAIL_USER`/`SMTP_*`.
- Espelha o fluxo do SAGRE (blastula). Ver [SDD/04-design-detalhado/02-design-modulos.md](SDD/04-design-detalhado/02-design-modulos.md#email).

## Estado / próximos passos
Marco 0 ✅. Próximo: **Marco 1** (telas e API do experimento + croqui drag-drop). Ver [SDD/01-visao-geral/03-roadmap.md](SDD/01-visao-geral/03-roadmap.md).

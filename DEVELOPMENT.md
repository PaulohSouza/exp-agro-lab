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

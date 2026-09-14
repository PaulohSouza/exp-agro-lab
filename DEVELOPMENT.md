# DEVELOPMENT — EXP-AGROLAB (monorepo)

Monorepo TypeScript (**pnpm 9** + Turborepo). Estado e handoff: [STATUS.md](STATUS.md). Visão geral: [README.md](README.md).

## Estrutura
```
packages/domain      # núcleo puro: croqui, RN-PROD, natureza, catálogo, sync, fluxo — Vitest
packages/analytics   # estatística TS (SAGRE) + golden/ — Vitest
apps/api             # NestJS + Prisma (MySQL) + storage S3/MinIO + PPTX/Excel
apps/web             # Next.js — fluxo completo
apps/mobile          # Expo (fora do workspace pnpm — use npm)
```

## Pré-requisitos
- Node ≥ 20, pnpm 9 (`npm i -g pnpm@9`), MySQL 8 **ou** Docker.

## Banco (dev)
- Banco dedicado **`expagrolab_dev`** (instância MySQL local; **separado** do schema `sagre`).
- Usuário `expagrolab`. Configure `apps/api/.env` a partir de `apps/api/.env.example`
  (`DATABASE_URL` e `SHADOW_DATABASE_URL`). O `.env` real **não é versionado**.

## Subir do zero (local)
```bash
pnpm install
pnpm --filter @exp/api exec prisma migrate dev   # aplica migrações
pnpm --filter @exp/api db:seed                    # cenário PC1699 + sandbox
pnpm --filter @exp/api build && node apps/api/dist/main.js   # API em :3001
pnpm --filter @exp/web dev                        # Web em :3000
```

## Subir via container (Docker)
Stack: **MySQL + MinIO + API (:3001) + Web (:3000)**.
```bash
docker compose up -d --build      # builda e sobe tudo
docker compose logs -f api        # acompanha migrate + seed + boot da API
# Web:           http://localhost:3000/login   (admin@demo.com / admin123)
# MinIO console: http://localhost:9001         (minioadmin / minioadmin)
docker compose down               # para tudo (use -v para apagar volumes)
```
Notas:
- A API roda `prisma migrate deploy` + `db:seed` (idempotentes) no start.
- O MySQL do container **não é exposto ao host** (evita conflito com o MySQL local).
- `NEXT_PUBLIC_API_BASE` é inlinado no build do Next apontando para `http://localhost:3001`.
- Storage: `S3_ENDPOINT=http://minio:9000` (interno) e `S3_PUBLIC_BASE=http://localhost:9000` (URL no `<img>`).
- Sem as vars `S3_*`, o upload cai no fallback local (`UPLOAD_DIR` + `GET /uploads/*`).

## Comandos úteis (raiz)
```bash
pnpm test           # domain + analytics (Vitest, via turbo)
pnpm typecheck      # typecheck de todos os pacotes do workspace
pnpm lint           # ESLint
pnpm format:check   # Prettier (check)
pnpm format         # Prettier (write)
pnpm build          # build de todos
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
- `SIMULATE_SEND=false`: envia via SMTP (nodemailer) usando `SMTP_*` / `EMAIL_FROM`. Se o SMTP estiver incompleto, cai de volta para SIMULATE.
- Espelha o fluxo do SAGRE (blastula). Ver [SDD/04-design-detalhado/02-design-modulos.md](SDD/04-design-detalhado/02-design-modulos.md#email).

## Auth (dev)
- Access token curto (`JWT_EXPIRES=15m` no Compose) + refresh (`JWT_REFRESH_EXPIRES=30d`).
- Web guarda `exp_refresh` e renova em single-flight; 401 refaz a requisição após o refresh.
- Senha forte no registro/criação: mín. `PASSWORD_MIN_LENGTH` (8) + letra + número.

## Mobile
Fora do workspace. `cd apps/mobile && npm ci` (obrigatório se o `node_modules` foi tocado). Ver [apps/mobile/README.md](apps/mobile/README.md).

## Estado / próximos passos
Release **v0.13.0**. Próximo: **Demanda F — coleta parcial**. Ver [STATUS.md](STATUS.md) §8 e [SDD 09](SDD/04-design-detalhado/09-fotos-coleta-parcial-timeline.md).

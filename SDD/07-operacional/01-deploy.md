# 01 — Deploy, monitoramento e backup

## Ambientes
- **dev:** Docker Compose (MySQL local — pode reusar a instância do sagre-app); API + Web em hot-reload; mobile via Expo/Metro.
- **staging/prod:** API NestJS (container), MySQL gerenciado, storage de fotos (S3-compatível), Web (Vercel/Node), mobile distribuído (Play Store/EAS).

## Deploy
- Build do monorepo via Turborepo (build incremental por app).
- Migrações Prisma versionadas; aplicar em pipeline antes do start da API.
- **Sem runtime R** em produção (estatística em TS).

## Monitoramento e observabilidade
- Logs estruturados (API), métricas de erro e latência; alertas no endpoint de sync (taxa de conflito, falhas de upload).
- Healthcheck da API e do banco.

## Backup e recuperação
- Backup diário do MySQL (dump + retenção); restauração testada periodicamente (RNF-10).
- Fotos/anexos com versionamento no storage.
- Mobile: dados locais são fonte temporária até confirmação de sync; nunca apagar local antes do ack do servidor.

## CI/CD
- CI: lint + typecheck + testes (unit/integração) + golden tests de analytics.
- Gate de PR: build verde e golden tests da estatística passando.

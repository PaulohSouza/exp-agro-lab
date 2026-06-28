# 02 — Controles de segurança

## Proteção de dados
- Dados de cliente (fluxo comercial) segregados por escopo de usuário.
- Senhas com hash (argon2/bcrypt); nunca em texto puro nos logs.
- HTTPS obrigatório (web/mobile ↔ API).

## Validação e integridade
- Validação na borda (Zod) e no domínio; nunca confiar no cliente.
- Sync idempotente (UUID) evita duplicação/replay; conflitos marcados para revisão.
- Soft-delete + auditoria preservam histórico.

## Auditoria e conformidade
- `StatusHistorico` e log de lançamentos/edições de avaliação.
- Trilha de quem aprovou/recusou protocolo.

## Boas práticas
- Segredos em `.env` (fora do git). Não versionar credenciais (inclui o `.env` do sagre-app).
- Rate limiting e proteção de força bruta no login.
- Backups criptografados (ver [07-operacional](../07-operacional/01-deploy.md)).

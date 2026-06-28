# 01 — Autenticação e autorização

## Autenticação
- Login por e-mail/senha; senha com hash forte (argon2/bcrypt). Legado: `usuarios`.
- Tokens JWT de acesso + refresh; expiração curta no acesso.
- Mobile: token persistido com segurança; revalidação no sync.

## Autorização (papéis + permissões)
Inspirada no modelo legado `acessos` / `grupo_acessos` / `usuarios_permissoes` (permissões por recurso/grupo).
- **Papéis** (ex.): Administrador, Coordenador/CAD, Analista, Assistente de campo, Cliente.
- **Permissões** granulares por recurso (experimentos, croqui, avaliações, orçamentos, cadastros, usuários) e ação (ver, criar, editar, excluir, aprovar).
- **Escopo:** Cliente só enxerga seus próprios protocolos/relatórios (fluxo comercial). Assistente de campo: foco em lançar avaliações dos protocolos atribuídos.

## Regras sensíveis
- Aprovação CAD (mudança para `AprovadoCAD/RecusadoCAD`) restrita ao papel Coordenador/CAD.
- Exclusão de tratamentos/avaliações registrada em auditoria.

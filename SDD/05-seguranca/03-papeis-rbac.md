# 03 — Papéis e RBAC

> Substitui o modelo de papéis **proposto** em
> [01-autenticacao-autorizacao.md](01-autenticacao-autorizacao.md). Fonte da
> verdade dos 7 papéis e do escopo. @see **RN-RBAC**, RN-TENANT.

## Hierarquia organizacional
`Instituicao → Departamento → Unidade(tipo=laboratorio) → Experimento`.
- **Departamento** é entidade **nova** (ver
  [01-modelo-dados.md](../04-design-detalhado/01-modelo-dados.md)).
- **Unidade(laboratorio)** é reaproveitada como **área/laboratório** de pesquisa.
- **AreaPesquisa** continua sendo cadastro **temático auxiliar** (Matologia,
  Entomologia…), não nó da hierarquia.

## Os 7 papéis (`User.papel: Papel`)

| Papel | Escopo |
|---|---|
| **admin_sistema** | **GLOBAL** — todas as instituições (operador do SaaS, super-admin) |
| **gestao_instituicao** | TUDO da sua instituição; gere usuários/departamentos/política |
| **gestao_departamento** | seu Departamento |
| **coordenador_area** | sua Unidade(laboratorio)/área; pode **aprovar** |
| **pesquisador** | seus ensaios (+ da sua área); **responsável pela coleta** |
| **analista** | ensaios **atribuídos**; analisa; **responsável pela coleta** |
| **assistente** | ensaios **atribuídos**; **só coleta** (equivale ao antigo nível `input`) |

## RN-RBAC — ações por recurso × papel
Ações: **V**er · **C**riar · **E**ditar · e**X**cluir · **A**provar · co**L**etar.

| Recurso | admin_sistema | gestao_instituicao | gestao_departamento | coordenador_area | pesquisador | analista | assistente |
|---|---|---|---|---|---|---|---|
| Experimento | VCEXA | VCEXA | VCEX (depto) | VCEX (área) +A | VCE (seus/área) | V (atrib.) +E análise | V (atrib.) |
| Croqui | VCEX | VCEX | VCEX (depto) | VCEX (área) | VCEX (seus) | V | V |
| Avaliação / coleta | VCEXL | VCEXL | VCEXL (depto) | VCEXL (área) | VCEL | VCEL (atrib.) | **L** (atrib.) |
| Cadastros (locais, produtos, áreas…) | VCEX | VCEX | V (+C/E do depto) | V | V | V | V |
| Usuários | VCEX (global) | VCEX (inst.) | V (depto) | V (área) | — | — | — |
| Departamentos / política | VCEX (global) | VCEX (inst.) | V | — | — | — | — |
| Dashboard | V (todas inst.) | V (inst.) | V (inst.→depto fatia 2) | V (inst.→área fatia 2) | V (próprios+atrib.) | V (próprios+atrib.) | V (próprios+atrib.) |

> Toda ação acima do papel de coleta exige também passar no **escopo de tenant**
> (RN-TENANT). A coluna “Aprovar” cobre aprovação CAD e aprovação interna de OS
> (RN-APROVA-OS): só **coordenador_area** e gestão acima.

## Super-admin global
**admin_sistema** é **cross-institution**: ignora o filtro `instituicaoId` para
ver/gerir todas as instituições (operação do SaaS). Os demais papéis ficam
**sempre** confinados pelo RN-TENANT (`instituicaoId` do JWT). Refino por
departamento/área é eixo **adicional** dentro do tenant, não o substitui.

## Migração `isAdminInstituicao` → `papel`
- `isAdminInstituicao = true` → **gestao_instituicao**.
- `isAdminInstituicao = false` → **analista**.
- O boolean `isAdminInstituicao` é **MANTIDO por retrocompat** na **fatia 1**
  (depreca em fatia futura). O **JWT passa a carregar `papel`**.

## Aplicação (futuro)
Decorator/guard **`@RequirePapel(...)`** + **policy** central (recurso × ação ×
escopo) no NestJS, derivando do `papel` do JWT e do escopo de tenant/depto/área.
Na fatia 1 o gate fino por depto/área ainda é grosso (instituição inteira para a
gestão) — ver [07-dashboard.md](../04-design-detalhado/07-dashboard.md).

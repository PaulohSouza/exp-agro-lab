# 07 — Dashboard

> Visão de acompanhamento **read-only**, escopada pelo papel. Endpoint único
> `GET /dashboard`. Papéis: ver [05-seguranca/03-papeis-rbac.md](../05-seguranca/03-papeis-rbac.md)
> (RN-RBAC). @see RN-TENANT.

## Objetivo
Dar ao usuário, conforme seu papel, um panorama dos experimentos e do andamento
das avaliações: quantos estão em condução, distribuição por status/local/área/
safra, e um **checklist derivado** das avaliações previstas (o que falta coletar
e o que já atrasou).

## Escopo por papel

| Papel | Escopo na **fatia 1** |
|---|---|
| **admin_sistema** | todas as instituições |
| **gestao_instituicao** | instituição inteira |
| **gestao_departamento** | instituição inteira *(refino por depto: fatia 2)* |
| **coordenador_area** | instituição inteira *(refino por área: fatia 2)* |
| **pesquisador** | seus próprios + atribuídos |
| **analista** | seus próprios + atribuídos |
| **assistente** | seus próprios + atribuídos |

## Agregações expostas (`GET /dashboard`)
Contagens de experimentos por:
- **status** (Inserindo / AprovadoCAD / RecusadoCAD / EmConducao / Concluido),
- **local** (`localId`),
- **área** (`Unidade` = laboratório),
- **safra** (`safraId`),
- **ensaio** (interno / comercial),
- total de **ensaios em condução**.

## Checklist derivado (acompanhamento de avaliações)
**Não há cadastro novo** — o estado é **calculado** sobre cada `Avaliacao` com
`dataPrevista`:

| Estado | Condição |
|---|---|
| **Realizada** | já existe `AvaliacaoDado` com valor para a avaliação |
| **Pendente** | sem dado **e** `dataPrevista` no **futuro** (≥ hoje) |
| **Atrasada** | sem dado **e** `dataPrevista` no **passado** (< hoje) |

A resposta traz as **contagens** (previstas / realizadas / pendentes /
atrasadas) e a **lista das próximas e das atrasadas** (avaliação + experimento +
`dataPrevista`), tudo já filtrado pelo escopo do papel.

## Fatia 1 vs fatia 2
- **Fatia 1:** endpoint + agregações + checklist derivado; escopo da gestão =
  **instituição inteira**; coleta-escopo (pesquisador/analista/assistente) =
  **próprios + atribuídos**.
- **Fatia 2:** **refino granular** por **departamento** e **área** (Unidade) para
  gestao_departamento/coordenador_area; possíveis filtros adicionais e séries
  temporais.

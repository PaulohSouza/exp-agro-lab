# 02 — Requisitos não funcionais

IDs `RNF-xx`.

## Plataformas
- **RNF-01** Web responsiva (gestão, planejamento, croqui, análise, relatório).
- **RNF-02** Mobile **React Native** (Android prioritário; iOS desejável) para coleta de campo.

## <a id="offline"></a>Offline-first (mobile) — requisito central
- **RNF-03** O app deve operar **sem conexão**: baixar protocolo + croqui + lista de avaliações para uso local.
- **RNF-04** Persistência local (SQLite via WatermelonDB/Drizzle) de avaliações, fotos e rascunhos.
- **RNF-05** **Sincronização** assíncrona com fila e *retry*; idempotência por chave (`protocolo+parcela+avaliacao+amostra`).
- **RNF-06** **Resolução de conflito** determinística (last-write-wins por campo + marcação para revisão quando divergir); nada de perda silenciosa.
- **RNF-07** Modelo de dados pensado para sync (ids estáveis/UUID, timestamps, soft-delete, versionamento de registro).

## Desempenho
- **RNF-08** Croqui fluido até ~500 parcelas (drag-drop sem travar); virtualização quando maior.
- **RNF-09** Análise estatística de um experimento típico em poucos segundos no servidor.

## Confiabilidade e dados
- **RNF-10** Backup diário do MySQL; restauração testada. Ver [07-operacional](../07-operacional/01-deploy.md).
- **RNF-11** Auditoria de mudanças de status e de lançamentos de avaliação.
- **RNF-12** **Fidelidade estatística:** resultados do port devem bater com o SAGRE dentro de tolerância numérica definida (golden tests) — ver [estratégia de testes](../06-testes/01-estrategia-testes.md).

## Manutenibilidade
- **RNF-13** Regras de domínio isoladas em `packages/domain` (testáveis, sem dependência de framework).
- **RNF-14** Tipos compartilhados ponta-a-ponta (API ↔ web ↔ mobile) via TypeScript + Zod.
- **RNF-15** Internacionalização não exigida no MVP, mas textos centralizados.

## Segurança
- **RNF-16** Autenticação por usuário, autorização por papel/permissão (granular, herdado do conceito legado `acessos`/`grupo_acessos`). Ver [05-seguranca](../05-seguranca/01-autenticacao-autorizacao.md).
- **RNF-17** Dados de cliente (fluxo comercial) protegidos; segregação por escopo.

## Portabilidade / Ambiente
- **RNF-18** Dev com Docker (MySQL); compatível com a instância MySQL local existente.
- **RNF-19** Sem dependência de R em produção.

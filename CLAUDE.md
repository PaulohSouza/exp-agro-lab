# CLAUDE.md — Contexto base do agente (EXP-AGROLAB)

> Regras e contexto sempre aplicáveis. Leia este arquivo e o [SDD/README.md](SDD/README.md) ao iniciar qualquer conversa. Os arquivos do SDD são curtos e referenciados — abra só o que a tarefa exigir.

## O que é o projeto
EXP-AGROLAB: sistema de gestão de experimentos agronômicos e laboratoriais. Cadastra experimentos de **1 a 3 fatores**, tratamentos, delineamento, **croqui clique-e-arraste**, avaliações (condicionais/calendarizadas, com **cálculo de unidade de saída**), em **dois fluxos** (comercial com orçamento / interno sem custo). Objeto de estudo **genérico** (cultura, máquina, pessoa/atleta…). Saída: **análise estatística** (portada do SAGRE) + **relatório PPTX**.

## Stack (decidida)
- **Monorepo TypeScript.** `apps/api` NestJS + Prisma + **MySQL**; `apps/web` Next.js/React; `apps/mobile` React Native **offline-first**; `packages/domain` (tipos + regras + Zod) compartilhado; `packages/analytics` (estatística portada do SAGRE).
- **Sem R em produção** — estatística reescrita em TS e validada por *golden tests* contra o SAGRE.
- Banco: **MySQL** (instância local do SAGRE-app pode ser usada para dev; credenciais no `.env` do sagre-app).

## Convenções
- **Padrão de desenvolvimento (obrigatório):** ver **[SDD/03-arquitetura/04-padroes-desenvolvimento.md](SDD/03-arquitetura/04-padroes-desenvolvimento.md)** — nomenclatura, banco (PK/FK/atributos/enums), camadas (controller fino → service → domínio), validação Zod e ferramental. Código novo nasce nesse padrão; legado é refatorado de forma incremental (§12 do doc).
- **Idioma:** documentação, UI e termos de **domínio** em **português** (parcela, bloco, tratamento, croqui, avaliação); termos **técnicos/estruturais** em inglês (Service, Controller, createdAt); **UI/output sempre PT**. Detalhe e exceções no padrão (§2). Seguir o estilo do código vizinho.
- **Tema azul do TCC:** navy `#1F2940`, sidebar `#141B2D`, accent sky `#4EC2F0`. Ver [SDD/04-design-detalhado/05-design-system.md](SDD/04-design-detalhado/05-design-system.md).
- **Domínio é a fonte da verdade:** regras (geração de croqui, cálculo de unidade de saída, condições de avaliação) vivem em `packages/domain`, não nas telas.
- Datas relativas → absolutas nos docs. Hoje a referência do projeto é 28/06/2026.

## Estado atual
**Ler [STATUS.md](STATUS.md) primeiro** — handoff completo (e a §8 "próximos passos"). Resumo (tag **v0.11.0**): Marco 0/1 ✅, Auth+Multi-tenancy+Compartilhamento ✅, OS (RF-26) ✅, Sync offline ✅, catálogo de avaliações/atividades + período/marcos + coleta agrupada ✅ (v0.7.0), padronização de código + CI ✅ (v0.8.0), croqui split-plot ✅ (v0.9.0), **Analytics fase B/C completa e validada por golden tests vs SAGRE** ✅ (v0.10.0–v0.11.0; **107 testes**, ver STATUS §3.1–3.7), **Relatório PPTX fase B** ✅ (layout fiel ao modelo SAGRE, marca da instituição; §8.3), RBAC 7 papéis + Dashboard ✅, web responsiva ✅. App mobile: scaffold + filtro de coleta (falta device).

Próximos (ver STATUS §8): **mobile em device** (Expo Go; `npm ci` em `apps/mobile` antes) · **endurecimento/infra** (refresh-token/senha forte, e-mail real, lint no CI, observabilidade) · **golden da conjunta multi-local** (bloqueado por falta de dado multi-local). Roadmap: [SDD/01-visao-geral/03-roadmap.md](SDD/01-visao-geral/03-roadmap.md).

> Nota dev: `pnpm` em `~/.local/bin` (symlink). MySQL local: root via socket (`mysql -u root`); app usa user `expagrolab` em `expagrolab_dev`/`expagrolab_shadow` (NÃO usar schema `sagre`). Credencial dev em `apps/api/.env` (não versionado). Push/release liberados.

## Glossário rápido
Protocolo = experimento. Parcela = unidade experimental (célula do croqui). Bloco = repetição. Tratamento (T1..Tn). Timing = momento (aplicação/avaliação). Avaliação = variável coletada. Delineamento = DIC/DBC/fatorial. Ver [SDD/08-anexos/glossario.md](SDD/08-anexos/glossario.md).

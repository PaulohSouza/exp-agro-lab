# CLAUDE.md — Contexto base do agente (EXP-AGROLAB)

> Regras e contexto sempre aplicáveis. Leia este arquivo e o [SDD/README.md](SDD/README.md) ao iniciar qualquer conversa. Os arquivos do SDD são curtos e referenciados — abra só o que a tarefa exigir.

## O que é o projeto
EXP-AGROLAB: sistema de gestão de experimentos agronômicos e laboratoriais. Cadastra experimentos de **1 a 3 fatores**, tratamentos, delineamento, **croqui clique-e-arraste**, avaliações (condicionais/calendarizadas, com **cálculo de unidade de saída**), em **dois fluxos** (comercial com orçamento / interno sem custo). Objeto de estudo **genérico** (cultura, máquina, pessoa/atleta…). Saída: **análise estatística** (portada do SAGRE) + **relatório PPTX**.

## Stack (decidida)
- **Monorepo TypeScript.** `apps/api` NestJS + Prisma + **MySQL**; `apps/web` Next.js/React; `apps/mobile` React Native **offline-first**; `packages/domain` (tipos + regras + Zod) compartilhado; `packages/analytics` (estatística portada do SAGRE).
- **Sem R em produção** — estatística reescrita em TS e validada por *golden tests* contra o SAGRE.
- Banco: **MySQL** (instância local do SAGRE-app pode ser usada para dev; credenciais no `.env` do sagre-app).

## Convenções
- **Idioma:** documentação, nomes de domínio e UI em **português**; identificadores de código em inglês quando padrão da lib, mas termos de domínio (parcela, bloco, tratamento, croqui, avaliação) podem ficar em PT para clareza. Seguir o estilo do código vizinho.
- **Tema azul do TCC:** navy `#1F2940`, sidebar `#141B2D`, accent sky `#4EC2F0`. Ver [SDD/04-design-detalhado/05-design-system.md](SDD/04-design-detalhado/05-design-system.md).
- **Domínio é a fonte da verdade:** regras (geração de croqui, cálculo de unidade de saída, condições de avaliação) vivem em `packages/domain`, não nas telas.
- Datas relativas → absolutas nos docs. Hoje a referência do projeto é 28/06/2026.

## Estado atual
**Ler [STATUS.md](STATUS.md) primeiro** — handoff completo. Resumo: Marco 0/1 ✅, Auth+Multi-tenancy+Compartilhamento ✅, Ordem de Serviço (RF-26) ✅, Sync offline ✅, App mobile (scaffold, não testado em device), **Analytics fase A** (ANOVA/LSD) ✅, **Relatório PPTX fase A** ✅. Fluxo web **input→análise→relatório** completo. 28 testes (domain 19 + analytics 9). Releases até **v0.6.0**.

Próximos: feedback dos testes ([TESTES.md](TESTES.md)) · analytics fase B (Tukey/Scott-Knott + golden vs SAGRE) · relatório fiel ao modelo PPTX · testar mobile em device. Roadmap: [SDD/01-visao-geral/03-roadmap.md](SDD/01-visao-geral/03-roadmap.md).

> Nota dev: `pnpm` em `~/.local/bin` (symlink). MySQL local: root via socket (`mysql -u root`); app usa user `expagrolab` em `expagrolab_dev`/`expagrolab_shadow` (NÃO usar schema `sagre`). Credencial dev em `apps/api/.env` (não versionado). Push/release liberados.

## Glossário rápido
Protocolo = experimento. Parcela = unidade experimental (célula do croqui). Bloco = repetição. Tratamento (T1..Tn). Timing = momento (aplicação/avaliação). Avaliação = variável coletada. Delineamento = DIC/DBC/fatorial. Ver [SDD/08-anexos/glossario.md](SDD/08-anexos/glossario.md).

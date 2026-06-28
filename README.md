# EXP-AGROLAB

Sistema para gestão de experimentos agronômicos e laboratoriais — experimentos de 1 a 3 fatores, tratamentos, croqui clique-e-arraste, avaliações (com cálculo de unidade de saída), dois fluxos (comercial/interno), análise estatística e relatório.

## Documentação
- 📊 **[STATUS.md](STATUS.md)** — estado atual + como rodar + próximos passos (leia primeiro para retomar).
- ✅ **[TESTES.md](TESTES.md)** — checklist de testes manuais do fluxo.
- 🛠️ **[DEVELOPMENT.md](DEVELOPMENT.md)** — comandos do monorepo.
- 📐 **[SDD/](SDD/README.md)** — Software Design Document (escopo, requisitos, arquitetura, modelo de dados, design, testes).
- 🤖 **[CLAUDE.md](CLAUDE.md)** — contexto base para retomar com o Claude.
- 🗺️ **[Roadmap](SDD/01-visao-geral/03-roadmap.md)** — etapas e progresso.

## Stack
Monorepo TypeScript: NestJS + Prisma + MySQL · Next.js (web) · Expo/React Native (mobile offline-first) · `packages/domain` + `packages/analytics`.

## Estado atual
Fluxo web completo **input → análise → relatório**, com auth/multi-tenancy, compartilhamento, ordem de serviço, sync offline e app mobile (scaffold). Releases até **v0.6.0**. Detalhes em [STATUS.md](STATUS.md).

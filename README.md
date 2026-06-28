# EXP-AGROLAB

Sistema para gestão de experimentos agronômicos e laboratoriais — experimentos de 1 a 3 fatores, tratamentos, croqui clique-e-arraste, avaliações (com cálculo de unidade de saída), dois fluxos (comercial/interno), análise estatística e relatório.

## Documentação
- 📐 **[SDD/](SDD/README.md)** — Software Design Document (escopo, requisitos, arquitetura, modelo de dados, design, segurança, testes, operação).
- 🤖 **[CLAUDE.md](CLAUDE.md)** — contexto base para retomar o trabalho com o Claude.
- 🗺️ **[Roadmap](SDD/01-visao-geral/03-roadmap.md)** — etapas de desenvolvimento.

## Stack (decidida)
Monorepo TypeScript: NestJS + Prisma + MySQL · Next.js (web) · React Native (mobile offline-first) · `packages/domain` + `packages/analytics` (estatística portada do SAGRE). Detalhes em [SDD/03-arquitetura/03-tecnologias.md](SDD/03-arquitetura/03-tecnologias.md).

## Estado atual
Fase de design (SDD concluído v1). Próximo: scaffolding do monorepo (Marco 0). Ver [roadmap](SDD/01-visao-geral/03-roadmap.md).

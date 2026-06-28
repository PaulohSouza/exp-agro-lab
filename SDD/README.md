# SDD — EXP-AGROLAB

> **Software Design Document** do sistema de gestão de experimentos agronômicos e laboratoriais EXP-AGROLAB.
> Documentação viva, curta e referenciada entre si. Mantida em português.

## Objetivo do documento
Servir de fonte única de verdade do projeto: escopo, requisitos, arquitetura, modelo de dados, design das telas (tema azul do TCC), segurança, testes e operação. Otimizado para retomar o trabalho em uma nova conversa com o Claude sem reconstruir contexto.

## Escopo do sistema (resumo)
Plataforma para cadastrar e gerir **experimentos de 1 a 3 fatores** com **tratamentos**, **delineamento**, **croqui clique-e-arraste**, **avaliações** (condicionais/calendarizadas, com cálculo de unidade de saída) e **dois fluxos**: **comercial** (com orçamento) e **interno** (TCCs e ensaios não pagos). O **objeto de estudo é genérico** (culturas, máquinas, pessoas/atletas, …) via cadastro categoria → subcategoria → objeto. Ao final, **análise estatística** (portada do SAGRE) e geração do **relatório PPTX**.

## Como navegar no SDD
| Pasta | Conteúdo |
|---|---|
| [01-visao-geral/](01-visao-geral/) | Contexto, objetivos e roadmap |
| [02-requisitos/](02-requisitos/) | Requisitos funcionais, não funcionais e regras de negócio |
| [03-arquitetura/](03-arquitetura/) | Visão arquitetural, diagramas e tecnologias |
| [04-design-detalhado/](04-design-detalhado/) | Modelo de dados, módulos, interfaces, fluxos e design system |
| [05-seguranca/](05-seguranca/) | Autenticação, autorização e controles |
| [06-testes/](06-testes/) | Estratégia de testes e cenário E2E "criar experimento" |
| [07-operacional/](07-operacional/) | Deploy, monitoramento e backup |
| [08-anexos/](08-anexos/) | Glossário, exemplos e referências |

## Decisões fundacionais (28/06/2026)
- **Stack:** TypeScript full-stack monorepo — NestJS + Prisma + **MySQL**, web Next.js/React, mobile React Native **offline-first**, `packages/domain` com tipos/regras compartilhados. Ver [03-arquitetura/03-tecnologias.md](03-arquitetura/03-tecnologias.md).
- **Estatística (SAGRE):** **reescrita na stack principal (TS)**, sem R em produção, com **validação golden** contra a saída do SAGRE. Ver [04-design-detalhado/02-design-modulos.md](04-design-detalhado/02-design-modulos.md) e [08-anexos/sagre-analytics.md](08-anexos/sagre-analytics.md).
- **MVP-1:** Núcleo do experimento + croqui clique-e-arraste + avaliações com cálculo de unidade de saída. Ver [01-visao-geral/03-roadmap.md](01-visao-geral/03-roadmap.md).

## Fontes / materiais de base (no repositório)
- `docs/` — documentos do TCC (projeto, apresentação) e export de protocolo real.
- `base-projeto/exp-agrolab/` — sistema do TCC (PHP) e tema azul.
- `BD/expagrolab.sql` — banco legado (48 tabelas) que fundamenta o modelo de dados.
- `prints-projeto-exemplo/` — telas-alvo (croqui, tratamentos, avaliações, lista de protocolos).
- `projeto pesquisa comercial/` — `fundacaomt-comercial` (Laravel) e `apppesquisa` (React Native) como base de telas/padrões.
- `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx` — formato-alvo do relatório.
- SAGRE-app: `/mnt/ds/drive/analytics/fmt-analytics-restrito/programming/projects/shiny/sagre-app` — análises R a portar.

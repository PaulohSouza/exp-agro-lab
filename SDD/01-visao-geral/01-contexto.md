# 01 — Contexto e motivação

## Contexto
O EXP-AGROLAB nasce de um Trabalho de Conclusão de Curso (TCC) e da operação real de pesquisa agronômica/laboratorial. Experimentos de campo e laboratório seguem um ciclo: **planejar** (objetivo, fatores, tratamentos, delineamento), **implantar** (croqui/sorteio das parcelas, etiquetas), **conduzir** (aplicações e avaliações ao longo do tempo, frequentemente em campo e offline), **analisar** (estatística) e **reportar** (relatório padronizado).

Hoje essas etapas estão fragmentadas entre:
- o sistema do TCC (`base-projeto/exp-agrolab`, PHP) — base conceitual e do **tema azul**;
- um sistema comercial em produção (`projeto pesquisa comercial`: Laravel `fundacaomt-comercial` + app React Native `apppesquisa`) — base de **telas e padrões**;
- o **SAGRE** (Shiny/R) — onde a **análise estatística** e o **relatório PPTX** acontecem hoje.

## Problema
A separação gera retrabalho e perda de rastreabilidade: dados redigitados entre coleta, análise e relatório; croqui montado manualmente; avaliações com cálculo de unidade de saída feitos fora do sistema; coleta de campo dependente de conexão. Não há uma plataforma única, genérica quanto ao objeto de estudo, que vá do **orçamento/abertura** até o **relatório final**.

## Motivação
Unificar o ciclo em uma plataforma só, **genérica** (serve a culturas, máquinas e pessoas/atletas), com **coleta mobile offline-first**, **croqui interativo** e **análise + relatório integrados** — preservando a estatística já validada do SAGRE por meio de reescrita validada.

## Stakeholders
| Papel | Interesse |
|---|---|
| Pesquisador/Analista | Planejar, conduzir avaliações, gerar relatório |
| Assistente de campo | Coletar avaliações por parcela (mobile, offline) |
| Coordenador/CAD | Aprovar/recusar protocolos, acompanhar status |
| Cliente (fluxo comercial) | Solicitar/aprovar orçamento, receber relatório |
| Cientista de dados | Garantir fidelidade estatística vs SAGRE |
| Autor do TCC / Product owner | Direção do produto |

## Premissas
- Banco **MySQL**; instância local do SAGRE-app disponível para desenvolvimento.
- Estatística do SAGRE será **reescrita em TypeScript**, validada contra saídas do SAGRE.
- Tema visual **azul do TCC** (ver [design system](../04-design-detalhado/05-design-system.md)).

## Restrições
- Coleta em campo pode ocorrer **sem internet** → mobile precisa ser offline-first com sincronização.
- Relatório final deve seguir o formato `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx`.
- Reescrever estatística carrega risco de **divergência** vs SAGRE → mitigado por testes golden (ver [estratégia de testes](../06-testes/01-estrategia-testes.md)).

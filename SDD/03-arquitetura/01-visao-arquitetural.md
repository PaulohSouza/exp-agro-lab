# 01 — Visão arquitetural

## Estilo
Monorepo TypeScript com **núcleo de domínio compartilhado** e múltiplos *delivery mechanisms* (API, web, mobile). Arquitetura em camadas inspirada em DDD tático: o domínio (regras de experimento, croqui, cálculo de avaliações, estatística) não depende de framework e é reutilizado por todos os apps.

## Componentes
| Componente | Pasta | Responsabilidade |
|---|---|---|
| **Domain** | `packages/domain` | Entidades, regras, tipos e validação (Zod): experimento, fatores, tratamentos, delineamento, **geração de croqui**, **cálculo de unidade de saída**, condições de avaliação. |
| **Analytics** | `packages/analytics` | Estatística portada do SAGRE (ANOVA, comparação de médias, fatorial, não-paramétrico, conjunta). Puro, testável, golden-validado. |
| **UI kit** | `packages/ui` | Componentes e **tema azul** compartilhados (web). |
| **API** | `apps/api` | NestJS: REST/tRPC, autenticação/autorização, persistência (Prisma/MySQL), orquestra domínio + analytics, geração de relatório PPTX, endpoints de sync. |
| **Web** | `apps/web` | Next.js/React: gestão, planejamento, **editor de croqui drag-drop**, avaliações, análise, relatório. |
| **Mobile** | `apps/mobile` | React Native **offline-first**: coleta por parcela, fotos, sync. |

## Camadas (dentro de api/domain)
```
apps/web  apps/mobile        (apresentação)
        │
   apps/api (aplicação: casos de uso, controllers, sync)
        │
 packages/domain  packages/analytics   (domínio puro)
        │
   infra: Prisma → MySQL, storage de fotos, geração PPTX
```

## Decisões-chave
- **Domínio compartilhado** evita reimplementar regra de croqui/cálculo no mobile e na web.
- **Analytics em TS** (sem R) → ver risco e mitigação em [03-tecnologias](03-tecnologias.md) e [sagre-analytics](../08-anexos/sagre-analytics.md).
- **Sync-friendly desde o schema** (UUIDs, timestamps, soft-delete) — ver [modelo de dados](../04-design-detalhado/01-modelo-dados.md).
- **Dois fluxos** (comercial/interno) como atributo do experimento + regras de transição de status, não como dois sistemas.

Diagramas em [02-diagramas](02-diagramas.md). Stack detalhada em [03-tecnologias](03-tecnologias.md).

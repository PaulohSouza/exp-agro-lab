# 02 — Diagramas

Diagramas em Mermaid (renderizam no GitHub/preview).

## C4 — Contexto
```mermaid
flowchart TB
  pesquisador([Pesquisador / Analista])
  campo([Assistente de campo])
  cliente([Cliente - fluxo comercial])
  sys[[EXP-AGROLAB]]
  pesquisador --> sys
  campo --> sys
  cliente --> sys
  sys -- relatório --> cliente
```

## C4 — Containers
```mermaid
flowchart LR
  subgraph Cliente
    web[Web Next.js]
    mobile[Mobile React Native offline-first]
  end
  api[API NestJS]
  db[(MySQL)]
  storage[(Storage de fotos/anexos)]
  web -->|HTTPS / tRPC| api
  mobile -->|sync HTTPS| api
  api --> db
  api --> storage
  api -.usa.-> domain[[packages/domain]]
  api -.usa.-> analytics[[packages/analytics]]
  api -->|PPTX| report[(Relatório .pptx)]
```

## Fluxo do experimento (alto nível)
```mermaid
flowchart LR
  A[Criar experimento\n1-3 fatores] --> B[Tratamentos\n+ produtos/timings]
  B --> C[Delineamento\nDIC/DBC/fatorial]
  C --> D[Gerar croqui\nauto + drag-drop]
  D --> E[Cadastrar avaliações\ncondicional/calendar.]
  E --> F[Coletar dados\nweb/mobile offline]
  F --> G[Cálculo unidade de saída\nkg-parcela → kg-ha]
  G --> H[Análise estatística\nport SAGRE]
  H --> I[Relatório PPTX]
```

## Estados do protocolo (fluxo comercial)
```mermaid
stateDiagram-v2
  [*] --> Inserindo
  Inserindo --> AprovadoCAD: aprovação
  Inserindo --> RecusadoCAD: recusa
  RecusadoCAD --> Inserindo: ajuste
  AprovadoCAD --> EmConducao: plantio confirmado
  EmConducao --> Concluido: avaliações + relatório
  Concluido --> [*]
```
> Fluxo **interno** (TCC): pula `AprovadoCAD/RecusadoCAD`, vai de `Inserindo` direto a `EmConducao`.

## Sincronização offline (mobile)
```mermaid
sequenceDiagram
  participant M as Mobile (offline)
  participant Q as Fila local
  participant A as API
  participant D as MySQL
  M->>Q: salvar avaliação (UUID, ts)
  Note over M,Q: sem internet
  M->>A: ao reconectar, enviar lote
  A->>A: idempotência (UUID) + merge por campo
  A->>D: persistir
  A-->>M: confirmações + conflitos p/ revisão
```

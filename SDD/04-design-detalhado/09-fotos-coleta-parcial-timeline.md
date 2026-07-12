# 09 — Fotos / dados documentais, coleta parcial e Timeline

> Três demandas relacionadas, projetadas juntas em 11/07/2026. Complementam o
> conceito **Avaliação × Atividade** do [08-catalogo-avaliacoes.md](08-catalogo-avaliacoes.md).
> Status da implementação: ver [STATUS.md](../../STATUS.md). Design vivo — atualizar ao avançar as fatias.

## Contexto / problema

Duas lacunas apareceram no uso real:

1. **Nem todo registro é numérico nem cobre todas as parcelas.** Foto de parcela é
   o caso canônico: é registro **por parcela**, mas **não** entra na análise
   estatística e, na prática, coleta-se **só de 1 ou 2 blocos** (documentar, não medir).
   Hoje toda `Avaliacao` é numérica (`valorColetado` → ANOVA) e a coleta assume
   **todas as parcelas** — uma coleta de 2 blocos ficaria eternamente "incompleta".
2. **Falta um histórico auditável do ensaio.** Quem coletou o quê, quando, em que
   plataforma; tarefas iniciadas/atrasadas/finalizadas; o que já está liberado para o
   cliente. Ver `timeline-exemplo.png` (feed vertical por data, com autor, plataforma
   e toggle "Disponível para o cliente").

## Decisão de enquadramento — foto é avaliação **ou** atividade?

Depende da **granularidade**, que é o eixo que o projeto já usa para separar os dois
registros (por parcela × nível experimento):

| Caso | Enquadramento | Porquê |
|---|---|---|
| Foto **de parcela** (ex.: "Registro fotográfico parcela: 35 DAP") | **Avaliação** de natureza documental | É por parcela; reusa croqui, coleta em lote, offline/sync e o `AvaliacaoDado.fotoUrl` que já existe. Excluída da ANOVA. |
| Foto **geral do ensaio** (talhão, clima, dano macro) | **Atividade** com campo `ARQUIVO` | Não tem parcela; é registro de nível experimento. |
| Nota/observação textual por parcela | **Avaliação** de natureza `TEXTO` | Mesma lógica da foto de parcela. |

Ou seja: **ambos os catálogos ganham suporte a dado não-numérico**, cada um na sua
granularidade. Modelar foto-de-parcela como atividade quebraria o vínculo com a
parcela (precisaria de N atividades ou gambiarra de campos) — por isso a foto de
parcela mora na **avaliação**.

---

## Demanda E — Natureza do dado da avaliação (numérica × documental)

### Modelo
`Avaliacao` (e `ModeloAvaliacao`) ganham:
```prisma
natureza  AvaliacaoNatureza @default(NUMERICA)   // NUMERICA | FOTO | TEXTO

enum AvaliacaoNatureza {
  NUMERICA   // atual: valorColetado → analytics/relatório de médias
  FOTO       // documental: fotoUrl por parcela; fora da ANOVA
  TEXTO      // documental: observação/nota por parcela; fora da ANOVA
}
```
`AvaliacaoDado` **já tem** `fotoUrl` e `observacoes` — nenhuma coluna nova para o valor;
apenas passa a aceitar registro sem `valorColetado` quando a natureza é documental.

### Regras (domínio — `packages/domain`)
- `entraNaAnalise(avaliacao)` → `natureza === NUMERICA`. **Analytics/relatório de médias
  ignoram** FOTO/TEXTO (guard no `AvaliacaoDado`/serviço de análise).
- Validação de coleta por natureza: NUMERICA exige `valorColetado`; FOTO exige `fotoUrl`;
  TEXTO exige `observacoes`.
- Herança do catálogo: `natureza` vem do `ModeloAvaliacao` e é sobreponível na avaliação
  (como `numeroPontos`).

### Impacto UI
- **Catálogo** (`/catalogo`): seletor de natureza no form do modelo.
- **Aba Avaliações**: a grade de coleta troca o input por **upload de foto** (FOTO) ou
  **campo de texto** (TEXTO); avaliações documentais não aparecem na aba Análise nem no
  relatório de médias (aparecem no **Anexos/Timeline**).
- **Upload de foto**: reusa/pauta o storage já usado por `fotoUrl` (hoje URL). Definir o
  backend de arquivos (local/dev; S3-compat futuro) — ver §Fatias.

---

## Demanda F — Escopo de coleta parcial (subconjunto de blocos/parcelas)

> **PRÓXIMA A IMPLEMENTAR.** Recurso **geral** (não só foto): qualquer avaliação pode ter
> alvo reduzido. O caso canônico é foto documental de "1 ou 2 blocos", mas vale para
> numérica também. **Ortogonal à Demanda E** (natureza) — uma avaliação FOTO de blocos 1,2 é
> a combinação natural, mas os dois eixos são independentes.

### Problema que resolve
Hoje a grade de coleta e a contagem de "lançamentos" (`Avaliacao._count.dados`) assumem
**todas as parcelas**. Uma coleta intencional de 2 de 8 blocos aparece como "incompleta"
para sempre e polui a grade com parcelas que nunca serão coletadas. F dá um **plano de
coleta** por avaliação: quais parcelas são **esperadas**.

### Modelo de dados (`Avaliacao` + join)
```prisma
// em model Avaliacao:
escopoColeta  EscopoColeta @default(TODAS)   // TODAS | BLOCOS | PARCELAS
blocosAlvo    String?                        // CSV dos blocos quando BLOCOS (ex.: "1,2")
parcelasAlvo  AvaliacaoParcelaAlvo[]         // relação inversa (quando PARCELAS)

enum EscopoColeta { TODAS  BLOCOS  PARCELAS }

// Escape hatch: seleção livre de parcelas (escopoColeta = PARCELAS)
model AvaliacaoParcelaAlvo {
  avaliacaoId String
  parcelaId   String
  avaliacao   Avaliacao @relation(fields: [avaliacaoId], references: [id], onDelete: Cascade)
  parcela     Parcela   @relation(fields: [parcelaId], references: [id], onDelete: Cascade)
  @@id([avaliacaoId, parcelaId])
  @@index([parcelaId])
}
// Parcela ganha a relação inversa: alvoDe AvaliacaoParcelaAlvo[]
```
**Decisão de armazenamento:** `blocosAlvo` como **CSV** (ex.: `"1,2"`) — simples, casa com o
mental model "colete os blocos 1 e 2" e evita join no caso comum. Seleção arbitrária de
parcelas usa o join `AvaliacaoParcelaAlvo`. Migration **aditiva** (default `TODAS` preserva
tudo).

### Regras (domínio — `packages/domain/src/avaliacao.ts`, puras + testadas)
```ts
export type EscopoColeta = "TODAS" | "BLOCOS" | "PARCELAS";
interface ParcelaRef { id: string; bloco: number }
interface EscopoColetaRef {
  escopoColeta?: EscopoColeta | null;
  blocosAlvo?: string | null;                 // CSV
  parcelasAlvo?: { parcelaId: string }[];      // quando PARCELAS
}

// blocos do CSV → number[] saneado (dedup, ordenado, ignora vazio/NaN)
export function parseBlocosAlvo(csv?: string | null): number[]

// resolve o conjunto-alvo de parcelas
export function parcelasEsperadas<T extends ParcelaRef>(aval: EscopoColetaRef, parcelas: T[]): T[]
//  TODAS    → parcelas
//  BLOCOS   → parcelas.filter(p => blocos.includes(p.bloco))
//  PARCELAS → parcelas.filter(p => new Set(parcelasAlvo.map(a=>a.parcelaId)).has(p.id))

// completude p/ a UI: quantas das esperadas já têm dado
export function completudeColeta(esperadas: {id:string}[], dados: {parcelaId:string; valorColetado?:number|null; fotoUrl?:string|null; observacoes?:string|null}[], natureza: AvaliacaoNatureza): { coletadas: number; esperadas: number }
//  "coletada" = a parcela esperada tem ao menos 1 dado válido p/ a natureza
//  (reusa validarColetaPorNatureza para saber o que conta como preenchido)

// validação do plano ao salvar (blocos/parcelas devem existir no experimento)
export function validarEscopoColeta(aval: EscopoColetaRef, parcelas: ParcelaRef[]): string | null
//  BLOCOS sem blocos válidos → erro; PARCELAS com id fora do experimento → erro
```
Casos de borda: `TODAS` com `blocosAlvo` preenchido → ignora o CSV (escopo manda);
`BLOCOS` vazio → erro de validação (não vira "nenhuma"); recasualizar o croqui **não**
invalida `blocosAlvo` (blocos persistem), mas **invalida** `AvaliacaoParcelaAlvo` se
parcelas forem recriadas — a API deve **repor/limpar** alvos órfãos ao salvar croqui.

### API (`AvaliacoesModule`)
- `criar`/`atualizar` aceitam `escopoColeta`, `blocosAlvo`, `parcelaIdsAlvo?: string[]`
  (Zod na borda); no `PARCELAS`, faz `deleteMany`+`createMany` do join numa transação
  (espelha o padrão de pré-requisitos). Revalida com `validarEscopoColeta` → **400**.
- `adicionarDoModelo`/`criar` documental: default sensato — **não** força escopo; herda
  `TODAS` (o usuário reduz na aba). (Opcional: `ModeloAvaliacao` poderia ter um
  `escopoColetaPadrao`, mas **fora do MVP de F** — decidir depois.)
- Listagem de avaliações passa a devolver `escopoColeta`/`blocosAlvo`/contagem de alvos e a
  **completude** (coletadas/esperadas) para a UI (substitui o `_count.dados` cru no rótulo).
- `coleta-lote` e `lancar`: **sem mudança de contrato** — só recebem menos células. Guard
  opcional: rejeitar lançamento em parcela **fora** do escopo (400) ou aceitar e avisar
  (decisão: **aceitar** — o escopo é um filtro de UI, não uma trava rígida; evita travar
  correções pontuais).

### Impacto UI (web)
- **Aba Avaliações**: editor de escopo por avaliação (linha da tabela ou no form) — *toggle*
  Todas / Blocos / Parcelas. `BLOCOS` → checkboxes dos blocos do experimento; `PARCELAS` →
  seleção clicando no **croqui** (reusa `CroquiEditor` em modo seleção). Mostrar
  **"coletadas X de Y esperadas"** no lugar do total.
- **Grade de coleta em lote** (`ColetaLote`) e **`Lançar`**: renderizam **só as parcelas
  esperadas** de cada avaliação (a grade já é parcela×avaliação; filtrar linhas por
  `parcelasEsperadas`). `dedupLancamentos` intacto.
- **Croqui**: destacar as parcelas-alvo quando a avaliação está selecionada (realce).

### Mobile (follow-up, como o B5)
`sync` pull expõe `escopoColeta`/`blocosAlvo`/alvos; chips de coleta filtram parcelas
esperadas. Validar em device.

### Analytics
Documental já sai (E). Numérica **parcial** ⇒ desbalanceada: **fora** do escopo da ANOVA
balanceada padrão. A análise deve **avisar** (banner) quando a avaliação tem
`escopoColeta ≠ TODAS`, em vez de rodar uma ANOVA silenciosamente inválida. (Não implementar
ANOVA desbalanceada agora.)

### Fatias (roadmap de F)
- **F1 schema** — enum `EscopoColeta` + `blocosAlvo` em `Avaliacao` + `AvaliacaoParcelaAlvo`
  + relação inversa em `Parcela`; migration aditiva; `DominioValor` (rótulos do enum).
- **F2 domínio** — `parseBlocosAlvo`, `parcelasEsperadas`, `completudeColeta`,
  `validarEscopoColeta` + testes (domain).
- **F3 API** — `criar`/`atualizar` com escopo (Zod + transação do join + revalidação);
  listagem devolve completude; higiene de alvos órfãos ao salvar croqui.
- **F4 web** — editor de escopo (toggle + checkboxes de bloco + seleção no croqui);
  grade/`Lançar` filtram por esperadas; rótulo de completude; realce no croqui.
- **F5 mobile** — sync + chips por escopo (follow-up, device).
- **Transversal** — e2e `test_coleta_parcial.py` (cria avaliação BLOCOS "1,2", verifica que
  `parcelasEsperadas` = só bloco 1,2, coleta-lote grava só nelas, completude 100% sem tocar
  os outros blocos; e um caso `PARCELAS` livre). Seed opcional.

### Estimativa/risco
Baixo-médio. Sem dependência externa nova. O ponto de atenção é a **higiene de alvos ao
recasualizar croqui** (parcelas recriadas invalidam `AvaliacaoParcelaAlvo`) — cobrir no F3 +
e2e. A seleção no croqui (F4) é a parte mais trabalhosa de front; se faltar tempo, entregar
**BLOCOS** primeiro (cobre o caso "1 ou 2 blocos") e deixar `PARCELAS`/seleção-no-croqui
como F4b.

---

## Demanda G — Timeline do experimento

Feed cronológico por experimento (nova **aba Timeline** no web; alimentável pelo tablet/mobile).
**Arquitetura híbrida:** o domínio continua a fonte da verdade; só o que não existe em
nenhuma tabela é persistido. Ver `timeline-exemplo.png`.

### Fontes do feed
1. **Registros manuais / declarações** (persistidos em `RegistroTimeline`): o botão
   "Adicionar registro" (TEXTO), declarações de revisão/assinatura, e as **transições de
   status de atividade** (iniciada/atrasada/finalizada — que hoje não têm timestamp próprio).
2. **Eventos derivados** (projetados na leitura, sem persistir): coletas de avaliação
   (`AvaliacaoDado.createdAt`/`origem`/`dispositivoId`), marcos confirmados
   (`AtividadeExperimento.data`/`marco`), OS aprovada, relatório PPTX gerado, convites.

### Modelo (`RegistroTimeline`)
```prisma
model RegistroTimeline {
  id             String @id @default(cuid())
  experimentoId  String
  tipo           TipoRegistroTimeline           // TEXTO | DECLARACAO | STATUS_ATIVIDADE
  titulo         String?
  corpo          String? @db.Text
  autorId        String?                        // Usuario (snapshot de nome abaixo)
  autorNome      String?
  plataforma     OrigemColeta @default(WEB)     // reusa WEB|MOBILE (mobile = tablet na UI)
  isVisivelCliente Boolean @default(false)      // toggle "Disponível para o cliente"
  ocorridoAt     DateTime                       // hora do evento (≠ createdAt)
  createdAt      DateTime @default(now())
  // Aninhamento sob a "task" (como na imagem: nº + nome da atividade/avaliação)
  atividadeId    String?
  avaliacaoId    String?
  experimento    Experimento @relation(fields: [experimentoId], references: [id], onDelete: Cascade)
  @@index([experimentoId])
}

enum TipoRegistroTimeline { TEXTO  DECLARACAO  STATUS_ATIVIDADE }
```

### Item unificado do feed (retorno da API — não é tabela)
`ItemTimeline { fonte: 'manual'|'derivado', tipo, titulo, corpo?, autorNome?, plataforma?,
ocorridoAt, isVisivelCliente, ref?: { avaliacaoId|atividadeId|... } }`. O serviço funde
`RegistroTimeline` + projeções e ordena desc por `ocorridoAt`, agrupando os aninhados sob
a atividade/avaliação (o "74548 - CONTROLE…" com sub-eventos).

### API
- `GET /experimentos/:id/timeline` → feed fundido e ordenado (params: `?cliente=true` filtra
  só `isVisivelCliente`, para o portal `/aprovacao/[token]`).
- `POST /experimentos/:id/timeline` → cria `RegistroTimeline` manual (Zod na borda).
- `PATCH /timeline/:id` (toggle `isVisivelCliente`) · `DELETE /timeline/:id` (autor/gestão).

### Impacto UI
- **Nova aba Timeline** (web): botão "Adicionar registro" + feed vertical (nós por data,
  hora, autor, plataforma, corpo, toggle "Disponível para o cliente").
- **Portal do cliente** (`/aprovacao/[token]`): feed filtrado por `isVisivelCliente`.
- **Conexão com E/F:** coletar foto de 2 blocos gera o evento derivado "Registro
  fotográfico — blocos 1,2 por Fulano (tablet)".

---

## Fatias (roadmap da feature)

Ordem: **E → F → G** (natureza destrava o caso foto; escopo parcial é ortogonal; timeline
consome ambos). Cada fatia = 1 PR, CI verde, e2e quando aplicável (padrão do projeto).

**E — Natureza do dado** ✅ (11/07/2026)
- E1 schema ✅: enum `AvaliacaoNatureza` + coluna em `Avaliacao`/`ModeloAvaliacao` (migration aditiva, default NUMERICA preserva tudo) + `DominioValor`.
- E2 domínio ✅: `entraNaAnalise`, `resolverNatureza`, `validarColetaPorNatureza` (NUMERICA leniente — retrocompat; FOTO/TEXTO obrigatórios). +3 testes (domain 62).
- E3 API ✅: guard nas rotas de análise/relatório (documental → 400); coleta aceita `fotoUrl`/`observacoes` validados por natureza; **`StorageService`** driver **S3-compatível (MinIO)** com fallback local (`POST /uploads`, valida tipo/10MB, `GET /uploads/*`); docker-compose ganhou `minio`+`minio-init`. Verificado ponta-a-ponta.
- E4 web ✅: seletor de natureza no `/catalogo` e no ad-hoc; `Lançar` natureza-aware (número/texto/upload com preview); grade de coleta exclui documental; badge; documental sem botão Análise. e2e `test_avaliacao_documental.py`.
- E-atividade ✅: `TipoCampo=ARQUIVO` (foto geral do ensaio) — schema+migration, domínio (slot `valorTexto`), catálogo e form de apontamento com upload. Verificado (400 sem arquivo / 201 com URL).
- **Follow-up:** seed com modelo-sistema demo "Registro fotográfico parcela" (FOTO).

**F — Coleta parcial**
- F1 schema: enum `EscopoColeta` + `blocosAlvo` em `Avaliacao` + `AvaliacaoParcelaAlvo` (migration) + `DominioValor`.
- F2 domínio: `parcelasEsperadas`, `completude`, guards. +testes.
- F3 API: editor de escopo (Zod: blocos/parcelas existem); grade/lote/sync usam só as esperadas.
- F4 web: toggle Todas/Blocos/Parcelas (blocos = checkboxes; parcelas = seleção no croqui); completude corrigida.
- F5 mobile: chips/coleta respeitam o escopo (follow-up, validar em device).

**G — Timeline**
- G1 schema: `RegistroTimeline` + enum `TipoRegistroTimeline` (migration) + `DominioValor`.
- G2 domínio/serviço de projeção: `ItemTimeline`, fusão manual+derivado, ordenação/agrupamento. +testes.
- G3 API: `GET/POST/PATCH/DELETE` da timeline; instrumentar transições de status de atividade (grava `STATUS_ATIVIDADE`).
- G4 web: aba Timeline (feed + adicionar registro + toggle cliente).
- G5 portal cliente: feed filtrado por `isVisivelCliente` em `/aprovacao/[token]`.

**Transversal:** seed (modelo-sistema demo "Registro fotográfico parcela" natureza FOTO escopo BLOCOS; alguns registros de timeline), docs, STATUS, e2e (`test_avaliacao_documental.py`, `test_coleta_parcial.py`, `test_timeline.py`).

## Decisões em aberto / follow-ups
- **Storage de arquivos:** dev = local + estático; produção = S3-compatível (definir na E3).
- **Plataforma "tablet":** hoje mapeada de `OrigemColeta.MOBILE`; avaliar enum próprio se surgir web-mobile.
- **Numeração de "task" na timeline** (o "74548" da imagem) — hoje o experimento/atividade
  usam `cuid`; definir se exibe um número sequencial legível por experimento.

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

Recurso **geral** (não só foto): qualquer avaliação pode ter alvo reduzido.

### Modelo (`Avaliacao`)
```prisma
escopoColeta  EscopoColeta @default(TODAS)   // TODAS | BLOCOS | PARCELAS
blocosAlvo    String?                        // JSON/CSV dos blocos, quando BLOCOS (ex.: "1,2")

enum EscopoColeta { TODAS  BLOCOS  PARCELAS }

// Escape hatch para seleção livre de parcelas (escopoColeta = PARCELAS)
model AvaliacaoParcelaAlvo {
  avaliacaoId String
  parcelaId   String
  avaliacao   Avaliacao @relation(fields: [avaliacaoId], references: [id], onDelete: Cascade)
  parcela     Parcela   @relation(fields: [parcelaId], references: [id], onDelete: Cascade)
  @@id([avaliacaoId, parcelaId])
  @@index([parcelaId])
}
```

### Regras (domínio)
- `parcelasEsperadas(avaliacao, parcelas)`:
  - `TODAS` → todas as parcelas do experimento;
  - `BLOCOS` → parcelas cujo `bloco ∈ blocosAlvo`;
  - `PARCELAS` → parcelas em `AvaliacaoParcelaAlvo`.
- `completude(avaliacao, dados)` → `coletadas / esperadas` (corrige o "8 de 32" eterno).
- Guard: `blocosAlvo`/alvos devem existir no experimento (Zod + revalidação na API).

### Impacto UI
- **Aba Avaliações**: editor de escopo por avaliação — *toggle* Todas/Blocos/Parcelas;
  quando Blocos, checkboxes dos blocos; quando Parcelas, seleção sobre o croqui.
- **Grade de coleta (web) e chips (mobile)**: renderizam/enfileiram **só as parcelas
  esperadas**. `coleta-lote`/`dedupLancamentos` intactos (só muda o conjunto de células).
- **Croqui**: destaca as parcelas-alvo quando a avaliação está selecionada.
- **Analytics**: natureza documental já sai; numérica parcial ⇒ desbalanceada (sinaliza,
  fora do escopo da ANOVA balanceada padrão — não é o caso de uso alvo).

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

**E — Natureza do dado**
- E1 schema: enum `AvaliacaoNatureza` + coluna em `Avaliacao`/`ModeloAvaliacao` (migration; default NUMERICA preserva tudo) + `DominioValor`.
- E2 domínio: `entraNaAnalise`, validação de coleta por natureza, herança do modelo. +testes.
- E3 API: guard nas rotas de análise/relatório (ignora documental); coleta aceita foto/texto; upload de arquivo (dev: storage local sob `apps/api`, servido estático; abstrair p/ S3-compat).
- E4 web: seletor de natureza no catálogo; grade de coleta com upload/texto; documentais fora de Análise/relatório de médias (vão p/ Anexos/Timeline).
- E-atividade: `TipoCampo=ARQUIVO` em `ModeloAtividadeCampo` (foto geral do ensaio) — schema + validação de apontamento + editor de campo + upload.

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

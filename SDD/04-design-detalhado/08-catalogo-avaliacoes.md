# 08 — Catálogo de avaliações + coleta agrupada

> Duas demandas que reestruturam as avaliações pensando em **múltiplas instituições**.
> Status da implementação: ver [STATUS.md](../../STATUS.md). Design vivo — atualizar ao avançar as fatias.

## Dois tipos de registro (conceito-base)
O experimento tem **dois tipos de registro**, com naturezas diferentes:

1. **Avaliação** — coleta **por parcela** (uma linha por parcela × ponto amostral). Ex.: Altura de plantas, Massa de parcela. É o `Avaliacao`/`AvaliacaoDado` atual.
2. **Atividade** — ação/registro **geral do experimento** (nível experimento, não por parcela):
   - **de ação** (sem coleta de dados): ex.: capina manual, controle de plantas daninhas — registra-se que/quando foi feita.
   - **com apontamento** (com coleta de dados **parametrizada/pré-cadastrada**): ex.: aplicação via CO₂ (vento, umidade, data); colheita (nº de linhas, comprimento).

**Vínculo importante:** a **Colheita** (atividade com apontamento) fornece os dados gerais (nº de linhas, comprimento) que alimentam o cálculo da avaliação **Massa de parcela / produtividade** (por parcela). Hoje esses campos de colheita vivem dentro de `AvaliacaoDado` (RN-PROD) — ver Demanda C.

## Contexto / problema
Hoje a avaliação é criada **solta dentro do experimento** (aba Avaliações). Isso não escala entre instituições: cada uma repete metodologias, e a mesma medida ("Altura de plantas") pode variar de formato entre o **padrão do sistema**, o **padrão da instituição** e a **metodologia própria do laboratório/departamento** (ex.: nº de pontos amostrais diferente). Além disso, no campo os dados costumam ser coletados **em conjunto** (Umidade + PMG + Produtividade; ou severidade de mancha-alvo + cercospora + nº de mariposas), e a coleta hoje é uma avaliação por vez.

## Demanda A — Catálogo de avaliações (multi-escopo)

### Modelo (`ModeloAvaliacao`)
Template reutilizável: `nome`, `descricaoColeta` (como coletar), `numeroPontos` (pontos amostrais), `metodologiaRelatorio` (base para a **IA** redigir o relatório), `unidadeColeta` → `unidadeSaida`, `calculoRelatorio` (fórmula). Ex.: Produtividade coleta-se em **kg** e converte para **sacas/ha** (ajustando umidade a 13%).

### Escopos (`EscopoModelo`)
- **sistema** — padrão geral, mantido pelo `admin_sistema`.
- **instituicao** — padrão da instituição; **só o admin da instituição** cadastra.
- **departamento** — metodologia própria do laboratório/depto.

A mesma medida pode existir nos três escopos. **Resolução:** a consulta **mostra as três versões rotuladas** (Geral / Instituição / Depto) e o usuário escolhe — não há "shadow" automático. Um modelo de escopo mais específico pode derivar de outro via `baseadoEmId` (ex.: depto herda o do sistema mudando só `numeroPontos`).

### Pré-requisitos (`ModeloAvaliacaoPrereq`, self-M:N)
Um modelo pode exigir outros. Ex.: **Produtividade** exige **Umidade** (necessária para converter a 13%). Ao adicionar uma avaliação ao experimento, o sistema **auto-adiciona os pré-requisitos (com aviso)** — fechamento transitivo. Regra no domínio.

### Uso no experimento
`Avaliacao.modeloId` (opcional) referencia o catálogo. Ao "Adicionar do catálogo", a avaliação **herda** os campos e permite **override** (principalmente `numeroPontos`). Avaliações ad-hoc continuam possíveis (`modeloId` nulo).

### RBAC por escopo
- `admin_sistema` → CRUD do escopo **sistema**.
- `gestao_instituicao` (admin) → CRUD do escopo **instituicao** da sua instituição.
- `gestao_departamento` / responsável → CRUD do escopo **departamento** do seu depto.
- Demais papéis → leitura. Ver [05-seguranca/03-papeis-rbac.md](../05-seguranca/03-papeis-rbac.md).

## Demanda B — Coleta agrupada (filtro de coleta)

Otimizar o tempo registrando várias avaliações de uma vez, na **web e no app**.
- **Filtro dinâmico:** a tela de coleta filtra as avaliações do experimento por **timing/data** e mostra todas juntas numa grade (parcela × avaliação).
- **Grupos salvos (`GrupoColeta` + `GrupoColetaItem`):** conjuntos nomeados reutilizáveis de modelos (ex.: "Colheita" = Umidade+PMG+Produtividade), escopados como o catálogo. Ao aplicar um grupo ao experimento, as avaliações entram marcadas com `Avaliacao.grupoColetaId`, permitindo filtrar a coleta **por grupo**.
- **Lote:** endpoint de coleta em lote grava várias avaliações × parcelas numa transação (offline-first no mobile, idempotente — reaproveita o `SyncModule`).

## Demanda C — Catálogo de atividades (ação / apontamento)

Espelha o catálogo de avaliações, multi-escopo (sistema/instituição/departamento).

### Modelo (`ModeloAtividade`)
`nome`, `descricao`, `tipo` (**`acao`** | **`apontamento`**), `escopo` + dono, `metodologiaRelatorio`.
- **acao**: sem campos de coleta.
- **apontamento**: define **campos parametrizados** (`ModeloAtividadeCampo`): `rotulo`, `tipo` (numero|texto|data|booleano), `unidade?`, `obrigatorio`, `ordem`. Ex.: CO₂ → {vento: numero m/s, umidade: numero %, data: data}.

### Registro no experimento (nível experimento, não por parcela)
`AtividadeExperimento` (instância de uma atividade no protocolo: data, responsável, obs, status) + `AtividadeApontamentoValor` (valor por campo, quando `apontamento`).

### Relação com avaliações
Uma avaliação pode **depender de uma atividade** (ex.: Massa de parcela depende da Colheita). Pré-requisitos passam a poder cruzar os dois tipos. A colheita (atividade com apontamento: nº linhas, comprimento) substitui os campos hoje embutidos em `AvaliacaoDado` (`numLinhasColhidas`, `comprimentoColhidoM`, `areaUtilM2`) — **decisão de migração pendente** (refatorar agora × manter por ora; ver STATUS).

> Nota: o `Atividade` atual no schema é um **cadastro simples** (nome+valorVenda) usado como rótulo em `TratamentoProduto` — não confundir com `ModeloAtividade`/`AtividadeExperimento` desta demanda.

## Modelo de dados (Prisma)
`ModeloAvaliacao` (+ enum `EscopoModelo`), `ModeloAvaliacaoPrereq`, `GrupoColeta`, `GrupoColetaItem`; `Avaliacao` ganha `modeloId?`, `grupoColetaId?`, `numeroPontos`, `descricaoColeta`. Migration `20260629124049_catalogo_avaliacoes_grupos_coleta`.

## Fatias (roadmap da feature)
**A — Catálogo:** A1 schema ✅ · A2 domínio (tipos+Zod+visibilidade por escopo+pré-requisitos transitivos)+testes · A3 API (`ModeloAvaliacaoModule` CRUD c/ RBAC) · A4 web (consulta 3 escopos + CRUD por papel) · A5 integração na aba Avaliações.
**B — Coleta agrupada:** B1 grupos (CRUD) · B2 domínio do agrupamento · B3 API coleta em lote · B4 web (filtro → grade multi-avaliação) · B5 mobile offline.
**Transversal:** seed (modelos-sistema demo), docs, STATUS.

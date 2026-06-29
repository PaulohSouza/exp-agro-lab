# C5 — Plano de migração: Colheita como Atividade

> Runbook da fatia C5. Move os apontamentos de colheita de `AvaliacaoDado` para uma
> **Atividade com apontamento** (nível experimento), repontando o cálculo de
> produtividade. É a etapa de **maior risco** da Macro C (toca RN-PROD, seed, análise,
> relatório, export e sync mobile). Ver [08-catalogo-avaliacoes.md](08-catalogo-avaliacoes.md).

## 1. Estado atual (o que existe hoje)
- `AvaliacaoDado` carrega, **por parcela**: `numLinhasColhidas`, `comprimentoColhidoM`, `areaUtilM2`.
- `Experimento.espacamentoLinhasM` (ex.: 0,45) é o espaçamento entre linhas.
- Área útil = `linhas × espaçamento × comprimento`; produtividade = `(massa_kg / areaUtil) × 10000`.
- Domínio: `calcularAreaUtilColhida(...)`, `calcularProdutividadeKgHa(...)`, `calcularSaida(...)` (fórmula `(valor/areaUtil)*10000`).
- **Consumidores da área útil** (todos recomputam `areaUtilM2 ?? linhas×espac×comprimento`):
  - `apps/api/src/avaliacoes/avaliacoes.service.ts` — `lancar` (~186/195), `relatorio` (~222), `analise` (~256).
  - `apps/api/src/export/export.service.ts` (~69).
  - `apps/api/src/sync/sync.service.ts` — pull/push de `numLinhasColhidas`/`comprimentoColhidoM` (mobile offline).
  - `apps/api/prisma/seed.ts` (~205–224) — popula linhas/comp/areaUtil do PC1699.
  - `apps/web/app/experimentos/[id]/AvaliacoesTab.tsx` — `usaArea` coleta linhas/comp **por parcela**.

## 2. Estado-alvo
- **Colheita = `ModeloAtividade` (tipo `apontamento`)**, escopo sistema, com campos parametrizados **`linhas`** (número) e **`comprimento`** (número, m). Marca especial `fornecAreaColheita = true` (ver §3).
- No experimento, existe **uma** `AtividadeExperimento` de colheita; seus valores definem a **área útil única** do ensaio: `areaUtil = linhas × Experimento.espacamentoLinhasM × comprimento`.
- A avaliação **Massa de parcela / Produtividade** coleta **só o peso** por parcela; a área útil vem da atividade de colheita (não mais por parcela).
- Decisão registrada: o usuário descreveu a colheita como **registro geral** do experimento → área útil **uniforme**. (Se no futuro precisar de área por parcela, a atividade pode ganhar valores por parcela — fora do escopo de C5.)

## 3. Mudanças de schema
1. **Marcador na colheita.** Adicionar `fornecAreaColheita Boolean @default(false)` em `ModeloAtividade` (identifica o modelo cuja atividade fornece a área útil). Alternativa sem schema: convenção por rótulos `linhas`/`comprimento` — preterida por ser frágil.
2. **Remover de `AvaliacaoDado`:** `numLinhasColhidas`, `comprimentoColhidoM`, `areaUtilM2`. (`valorColetado` continua = massa kg.)
3. Migration nova. **Dado é dev-only** (PC1699 do seed) e o usuário autorizou limpar → migração **destrutiva** aceitável: dropar colunas e recriar via seed. (Em produção exigiria back-fill: criar a Atividade-Colheita a partir dos valores médios antes de dropar — fora de escopo agora.)

## 4. Mudança de cálculo (resolução da área útil)
Criar um helper único (ex.: `areaUtilDoExperimento(expId)`) que:
1. busca a `AtividadeExperimento` de colheita (via `modelo.fornecAreaColheita = true`);
2. lê `linhas` e `comprimento` dos `valores`;
3. retorna `calcularAreaUtilColhida({ numLinhasColhidas: linhas, espacamentoLinhasM: exp.espacamentoLinhasM, comprimentoColhidoM: comprimento })`, ou `undefined` se a colheita não foi registrada.

Repontar para esse helper (removendo o fallback por-parcela):
- `avaliacoes.service.ts`: `relatorio`, `analise`, `lancar` (lançar deixa de aceitar linhas/comp).
- `export.service.ts`.
- O `areaUtil` passa a ser **o mesmo para todas as parcelas** da avaliação.

## 5. Domínio
- `calcularAreaUtilColhida` / `calcularProdutividadeKgHa` **permanecem** (puros, reusados pelo helper). Sem mudança de assinatura.
- Opcional: teste novo garantindo que a área vem da colheita (1 atividade → área aplicada a N parcelas).

## 6. Sync (mobile) — atenção
- `sync.service.ts` hoje sincroniza `numLinhasColhidas`/`comprimentoColhidoM` por dado. Após a remoção desses campos, o **pull/push** muda:
  - remover esses campos do payload de coleta;
  - a colheita (atividade) é registrada no nível experimento — definir se entra no escopo offline agora ou fica online-only (proposta: **online-only** em C5; coleta offline de atividades fica para a Macro B).
- Garantir compatibilidade com app já instalado (campo ausente → ignorado).

## 7. Web
- `AvaliacoesTab.tsx`: remover o ramo `usaArea` (colunas Nº linhas / Compr. por parcela). O lançamento de massa passa a pedir só o valor.
- A colheita é registrada na **aba Atividades** (já existe em C4), usando o modelo de colheita do catálogo.
- Mensagem amigável quando a produtividade é pedida sem colheita registrada ("registre a atividade de Colheita para calcular kg/ha").

## 8. Seed
- `seed.ts`: criar o `ModeloAtividade` "Colheita" (sistema, apontamento, `fornecAreaColheita=true`, campos linhas/comprimento) + uma `AtividadeExperimento` de colheita no PC1699 (linhas=4, comprimento=5). Remover a escrita de linhas/comp/areaUtil em `AvaliacaoDado` (manter só `valorColetado`).
- Manter o exemplo de validação (8,5 kg / 9 m² ≈ 9.444 kg/ha) — agora a área vem da colheita.

## 9. Ordem de execução (com checkpoints)
1. Schema: add `fornecAreaColheita`; **ainda não** remover colunas. Migration A. Build.
2. Seed: criar modelo+atividade de colheita; manter colunas antigas preenchidas (transição). Verificar produtividade idêntica via helper novo lendo a colheita.
3. Repontar API (avaliacoes/export) para o helper; rodar testes + e2e + conferir CV≈1,2% no PC1699.
4. Web: remover `usaArea`. Validar lançamento + relatório.
5. Sync: ajustar payload.
6. **Só então** remover as 3 colunas de `AvaliacaoDado` (Migration B) + limpar refs. Rebuild, testes, e2e.
7. Atualizar STATUS + golden notes.

## 10. Riscos & rollback
- **Risco:** quebra do RN-PROD/CV do PC1699 → mitigado pelo checkpoint §9.3 (comparar antes/depois).
- **Risco:** app mobile com payload antigo → campos ausentes ignorados (nullable).
- **Rollback:** as duas migrations são separadas; reverter a Migration B restaura as colunas (dados perdidos, mas é dev). Helper e refs ficam atrás de commits isolados por etapa.

## 11. Limpeza autorizada (dev)
O usuário autorizou limpar registros exclusivos deste banco. Itens candidatos:
- modelos de avaliação duplicados de teste ("Produtividade" × "Produtividade (padrão)") — consolidar em um.
- `AvaliacaoDado` do PC1699 será reescrito pelo seed após a refatoração.

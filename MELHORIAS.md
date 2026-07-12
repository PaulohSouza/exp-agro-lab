# MELHORIAS — necessidades levantadas por simulação

> Levantamento a partir de uma **simulação de ponta a ponta** (11/07/2026): 4 experimentos
> em **Fitopatologia** (ferrugem asiática da soja) — **DIC, DBC, Fatorial (DBC) e Parcela
> subdividida** — com 2 variáveis: **Produtividade** (sacas/ha, 60–70) e **Altura de plantas**
> (**5 plantas por parcela**), conduzidos pelos endpoints HTTP reais até o **relatório PPTX**.
> Script: `scratchpad/sim.mjs` · resultados: `scratchpad/sim_resultados.json` · PPTX: `scratchpad/relatorio_*.pptx`.

## Resumo da simulação
| Exp | Trat×Rep | Parcelas | Produtividade (análise) | Altura 5 plantas (análise) |
|---|---|---|---|---|
| DIC | 5×4 | 20 | ✅ n=20, GLres=15, CV≈1,0% | ⚠️ **n=100, GLres=95** (pseudorreplicação) |
| DBC | 5×4 | 20 | ✅ n=20, GLres=12, CV≈0,7% | ⚠️ **n=100, GLres=92** (pseudorreplicação) |
| Fatorial (3×2) DBC | 6×4 | 24 | ✅ n=24 | ❌ **400** "DBC exige uma repetição por bloco" |
| Parcela subdividida (3×2) | 6×4 | 24 | ✅ n=24 (2 erros) | ❌ **400** "split-plot exige dados balanceados" |

No relatório PPTX: DIC/DBC trazem a Altura (com estatística inválida); **Fatorial e Split perdem a Altura por completo** (0 slides) — a variável some sem aviso.

---

## M1 — 🔴 CRÍTICO: pontos amostrais (N amostras/parcela) não são agregados na análise
**O quê.** A coleta grava várias amostras por parcela (`AvaliacaoDado.numeroAmostra`, ex.: 5 plantas),
mas `AvaliacoesService.analise` (`apps/api/src/avaliacoes/avaliacoes.service.ts`) trata **cada amostra
como uma observação independente** em todos os caminhos (1-fator, fatorial, split-plot, não-paramétrico).

**Impacto.**
- **DIC/DBC:** pseudorreplicação — n e GL do resíduo inflam (n=100 em vez de 20; GLres 95/92 em vez de 15/12).
  Erro-padrão, p-valores e agrupamento de médias (Tukey/letras) ficam **estatisticamente inválidos** (superestimam significância).
- **Fatorial / Split-plot:** a ANOVA exige balanceamento (r×a×b) e **rejeita com HTTP 400**. A variável fica **inanalisável**.
- **Relatório:** `RelatorioService.gerarPptx` faz `catch { continue }` (linha ~101) e a variável que falha **desaparece do PPTX** sem nota.

**Correção.** A **unidade experimental é a parcela**. Agregar as amostras por parcela (média — padrão em
subamostragem agronômica) **antes** de montar as observações da ANOVA. Isso corrige a pseudorreplicação
**e** restaura o balanceamento de fatorial/split simultaneamente. Com 1 amostra/parcela o resultado é idêntico
ao atual (não quebra golden/e2e). → **corrigido nesta rodada.**

## M2 — 🟠 `numeroPontos` não é configurável em avaliação ad-hoc
**O quê.** `criarAvaliacaoSchema`/`atualizarAvaliacaoSchema` (`avaliacoes.controller.ts`) não expõem `numeroPontos`.
Só o **catálogo** (`ModeloAvaliacao`) o define. Uma avaliação criada direto na aba Avaliações (caminho mais comum)
fica presa em `numeroPontos=1`, sem como declarar "5 plantas por parcela".

**Correção.** Aceitar `numeroPontos` em criar/atualizar avaliação (schema + service). → **corrigido nesta rodada.**

## M3 — 🟡 Coleta de múltiplos pontos amostrais na UI web
**O quê.** A grade de coleta em lote (web) coleta **1 valor por célula** (parcela × avaliação); não há UI para
lançar as N plantas. A persistência e o app mobile já têm `numeroAmostra`, mas a web não expõe.
**Follow-up de produto** (maior; não corrigido agora). Depende de M2 para saber quantos pontos renderizar.

## M4 — 🟡 Relatório descarta variável silenciosamente
**O quê.** O `catch { continue }` do relatório engole qualquer falha de análise sem registrar. Mesmo após M1,
outra falha (ex.: dados insuficientes) some sem rastro. **Melhoria:** ao menos logar a variável ignorada
(feito, mínimo) e, idealmente, renderizar uma nota "sem análise disponível" no PPTX (follow-up).

## M5 — 🟢 Menor: `analise` sempre agrega por média
A agregação por parcela usa **média**. Para variáveis de contagem (ex.: nº de plantas doentes) a agregação
correta pode ser **soma**. Hoje não há como escolher. Follow-up: campo `agregacaoPontos` (média/soma) no modelo/avaliação.

---

### Priorização desta rodada
Corrigir **M1** (correção estatística — resolve os sintomas agudos de fatorial/split/relatório) e **M2**
(barato e complementar) + log de M4. **M3/M5** ficam como follow-up documentado. Depois: endurecimento/infra (STATUS §8.5).

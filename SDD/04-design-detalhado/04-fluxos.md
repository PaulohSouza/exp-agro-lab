# 04 — Fluxos e regras de negócio

## Fluxo 1 — Criar experimento (núcleo do MVP-1)
1. **Geral:** preencher metadados (objetivo, objeto/cultura, local, safra, delineamento, parcela, repetições, ensaio).
2. **Fatores:** definir 1–3 fatores e níveis → sistema **deriva tratamentos** (T1..Tn).
3. **Tratamentos:** completar produtos/dose/timing por tratamento.
4. **Croqui:** `gerarCroqui` (casualização conforme delineamento) → revisar/editar drag-drop → salvar layout.
5. **Avaliações:** cadastrar variáveis (unidade de coleta/saída, fórmula, condição/data).
6. Experimento pronto para condução. (Cenário E2E em [06-testes/02-casos-testes.md](../06-testes/02-casos-testes.md).)

## Fluxo 2 — Comercial × Interno
- `ensaio = comercial` → exige **Orçamento** (itens de avaliações/atividades/produtos) e **aprovação CAD** antes de conduzir; vincula `Cliente`.
- `ensaio = interno` (TCC) → sem orçamento; vai direto à condução.
- Regras de transição de status em [diagramas](../03-arquitetura/02-diagramas.md). Toda transição grava `StatusHistorico`.

## Fluxo 3 — Coleta + apontamentos da atividade
1. Avaliador (web/mobile) lança o **valor bruto** `valorColetado` por parcela/amostra.
2. **Atividade de colheita (RN-PROD):** por parcela, registram-se os **apontamentos** `numLinhasColhidas`, `comprimentoColhidoM` e `areaUtilM2` (= linhas × `espacamentoLinhasM` do experimento × comprimento). O espaçamento vem do cadastro.
3. Mobile: lançamento offline → fila → sync idempotente.

## Fluxo 3b — Produtividade (apresentada no relatório)
- O **valor de produtividade** (kg/parcela → **kg/ha**) é **apresentado na geração do relatório** por `domain.calcularProdutividadeKgHa`/`calcularSaida`, a partir do bruto + `areaUtilM2` apontada. Recalculável; não persistido na linha de coleta. Ver Fluxo 4.

## Fluxo 4 — Análise e relatório
1. Selecionar avaliação(ões) e configuração (delineamento já conhecido).
2. `analytics` decide a rota (ANOVA / transformação / GLM / não-paramétrico) e calcula médias + letras. Ver [sagre-analytics](../08-anexos/sagre-analytics.md).
3. Gerar **relatório PPTX** no formato do modelo.

## Regras-chave (resumo; detalhes nos requisitos)
- **RN-CROQUI** — casualização por delineamento; edição manual sobrescreve; numeração e início configuráveis.
- **RN-CALC / RN-PROD** — cálculo de unidade de saída no domínio; produtividade kg/parcela→kg/ha.
- **RN-FLUXO** — comercial exige orçamento+aprovação; interno não.
- **RN-SYNC** — idempotência por UUID; merge por campo; conflitos marcados, nunca descartados.

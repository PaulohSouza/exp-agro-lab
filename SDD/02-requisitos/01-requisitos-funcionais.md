# 01 — Requisitos funcionais e regras de negócio

IDs `RF-xx`. Prioridade: ⭐ MVP-1 · ▲ próximos marcos. Telas-alvo: `prints-projeto-exemplo/`.

## Cadastros base (genéricos)
- **RF-01** ⭐ Cadastrar **objeto de estudo genérico** em hierarquia **categoria → subcategoria → objeto** (ex.: Cultura → Algodão → "FM 944 GL"; Máquina → Pulverizador → modelo X; Pessoa → Atleta → indivíduo). Legado: `objetos_categorias`, `objetos_subcategorias`, `objetos_estudos`.
- **RF-02** ⭐ Cadastrar **locais**, **safras/anos**, **unidades amostrais**, **atividades**, **delineamentos**, **produtos** e **marcas**. Legado: `locais`, `anos`, `unidades_amostrais`, `atividades`, `delineamentos`, `produtos`, `marcas`.

## Experimento / Protocolo
- **RF-03** ⭐ Criar **experimento (protocolo)** com: objetivo, área de pesquisa, objeto/cultura+cultivar, local, safra, tipo de execução, ensaio (interno/comercial), metodologia, observações, justificativa, previsão de semeadura. (Aba **Geral** do print.)
- **RF-04** ⭐ Definir **fatores (1 a 3)** e seus níveis; o sistema deriva os **tratamentos** (T1..Tn) a partir da combinação dos níveis (fatorial) ou de lista direta.
- **RF-05** ⭐ Definir **delineamento** (DIC, DBC, fatorial; futuro: parcela subdividida/split-plot), **nº de repetições/blocos**, **dimensão da parcela** (ex.: 4,05 m × 7 m = 9 linhas × 7 m) e **total de parcelas**.
- **RF-06** ⭐ **Tratamentos**: nome, descrição, e por tratamento uma lista de produtos com **modo de aplicação, dose, volume de calda (L/ha), referência, timing e atividade**. Legado: `tratamentos`, `produtos_timings`.

## Croqui (clique-e-arraste)
- **RF-07** ⭐ **Gerar croqui automaticamente** a partir do delineamento: grade de parcelas (bloco × tratamento), **sorteio/casualização** conforme o delineamento, **numeração das parcelas**, cor por tratamento e **ponto de início**.
- **RF-08** ⭐ **Editar croqui clique-e-arraste**: mover/realocar tratamentos entre parcelas, ajustar layout (linhas/colunas, sentido de caminhamento), definir parcela de início. Persistir o layout final. (Aba **Croqui** + "Editar Croqui".)
- **RF-09** ▲ Gerar **etiquetas** das parcelas e **PDF** do croqui.

## Avaliações
- **RF-10** ⭐ Cadastrar **avaliações** (variáveis): nome, metodologia, unidade de coleta, **unidade de saída** e **fórmula de conversão**. Tipos: **calendarizada** (data prevista) e **condicional** (ex.: "5 dias após 1ª aplicação", "70–80% de capulhos abertos"). Suporte a avaliação **personalizada** (escala de notas, registro fotográfico). Legado: `avaliacoes`, `dados_experimentos`.
- **RF-11** ⭐ **Cálculo de unidade de saída (no relatório)**: a avaliação define `unidade_coleta`, `unidade_saida` e `formula`; a **conversão é aplicada na geração do relatório** sobre os valores brutos coletados (não na coleta). **Caso-âncora — produtividade:** coleta em **kg/parcela** → saída em **kg/ha** usando a **área útil colhida**. Ver [regra RN-PROD](#rn-prod).
- **RF-12** ⭐ **Lançar avaliações por parcela** (valor, observação, status, nº de amostra/sub-amostra). Exportar avaliações (Excel). (Abas **Avaliações** e **Aplicações**.)

## Fluxos e ciclo de vida
- **RF-13** ▲ **Fluxo comercial**: orçamento (itens/valores de avaliações, atividades, produtos), aprovação **CAD** (Aprovado/Recusado), vínculo cliente. Legado: `orcamentos`, `clientes`.
- **RF-14** ▲ **Fluxo interno** (TCC/ensaio): sem custo, mesmo núcleo experimental.
- **RF-15** ▲ **Status do protocolo** com trilha (Inserindo, Aprovado CAD, Recusado CAD, Em condução, Concluído…) e **lista de protocolos** com filtros (status, safra, área, cultura, local, tipo execução, analista). (Print "Tela de projetos".)
- **RF-16** ▲ **Timeline** do protocolo (aplicações × avaliações no tempo) e **Manejo Comum**.

## Análise e relatório
- **RF-17** ▲ **Analisar** o experimento: ANOVA, comparação de médias (Tukey/Scott-Knott…), fatorial 1–3, não-paramétrico, **conjunta multi-local**. Port do SAGRE — ver [sagre-analytics](../08-anexos/sagre-analytics.md).
- **RF-18** ▲ **Gerar relatório PPTX** no formato `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx`.

## Mobile (coleta de campo)
- **RF-19** ▲ Baixar protocolo + croqui no dispositivo; **lançar avaliações offline** por parcela com fotos; **sincronizar** ao reconectar (ver [RNF offline](02-requisitos-nao-funcionais.md#offline)).

## Regras de negócio
- <a id="rn-prod"></a>**RN-PROD (produtividade):** ✅ definido. A **coleta no campo registra apenas valores brutos**; a **conversão para a unidade de saída ocorre só na geração do relatório**.
  - **Atividade de colheita (apontamentos):** por parcela, registram-se o peso bruto (ex.: kg/parcela), `num_linhas_colhidas`, `comprimento_colhido_m` e a `area_util_m2` (= `num_linhas_colhidas × espacamento_linhas_m × comprimento_colhido_m`, com `espacamento_linhas_m` do cadastro do experimento).
  - **Relatório (apresentação):** apresenta a produtividade `kg_ha = (peso_kg_parcela / area_util_m2) × 10.000`. Ver [glossário](../08-anexos/glossario.md) e [exemplos](../08-anexos/exemplos.md).
- **RN-CALC (genérico):** toda avaliação pode ter `unidade_coleta`, `unidade_saida` e `formula` (expressão com variáveis: valor coletado, área útil, nº plantas, fator). O cálculo é responsabilidade de `packages/domain`.
- **RN-CROQUI:** casualização respeita o delineamento (DBC: sorteio dentro de cada bloco; DIC: sorteio global). Numeração e ponto de início configuráveis; layout editado manualmente sobrescreve o automático.
- **RN-FLUXO:** `ensaio = interno` dispensa orçamento/aprovação CAD; `ensaio = comercial` exige orçamento e aprovação antes de conduzir.

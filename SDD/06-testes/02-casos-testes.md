# 02 — Casos de teste

## Cenário E2E principal — "Criar um experimento no fluxo" (passo V)
Baseado no protocolo real `PC1699 – Tidil Desfolhante` (`docs/export atual...pdf`, prints). Serve de **teste de aceitação do MVP-1** e de **seed/fixture**.

### Dados do cenário
- Ensaio: **interno** (TCC); Área: Matologia; Objeto/Cultura: Algodão; Cultivar: FM 944 GL.
- Local: CAD Primavera; Safra: 25/26; Delineamento: **DBC**.
- Parcela: 4,05 m × 7 m (9 linhas × 7 m); **Tratamentos: 5**; **Repetições: 4**; **Total parcelas: 20**.
- Objetivo: "Avaliar a eficácia de Thiadizuron 480SC isolado e em mistura com diuron na desfolha do algodão".

### Passos / asserções
1. **Criar experimento (Geral)** → persistido com status `Inserindo`.
2. **Definir 1 fator (5 níveis)** → sistema deriva **5 tratamentos** (T1..T5). _Assert:_ `numTratamentos = 5`.
3. **Tratamentos** → adicionar produtos (ex.: Punto, Agefix, TIDIL/WakeUp) com dose, modo, vol. calda, timing. _Assert:_ produtos vinculados.
4. **Gerar croqui** (DBC, 4 blocos × 5 tratamentos) → **20 parcelas**, casualização por bloco, numeração e ponto de início. _Assert:_ `totalParcelas = 20`; cada bloco tem os 5 tratamentos exatamente uma vez.
5. **Editar croqui (drag-drop)** → mover um tratamento; salvar. _Assert:_ layout persistido reflete o movimento; integridade do delineamento validada/avisada.
6. **Cadastrar avaliação de produtividade**: unidade coleta `kg/parcela`, saída `kg/ha`, fórmula `(valor/areaUtil)*10000`. Espaçamento do experimento = 4,05/9 = 0,45 m.
7. **Atividade de colheita** numa parcela: usuário informa `valor=8,5 kg`, `numLinhasColhidas=4`, `comprimentoColhidoM=5`. _Assert:_ a linha guarda os brutos + `areaUtilM2 = 4×0,45×5 = 9,0` (apontamento); **sem** produtividade.
8. **Gerar relatório** → apresenta produtividade: _Assert:_ `≈ 8,5/9,0×10000 ≈ 9.444 kg/ha` (calculada no relatório, não persistida na coleta).
8. **(mobile)** lançar offline e sincronizar. _Assert:_ dado aparece na web; reenvio não duplica (idempotência).

## Casos unitários-chave (domain)
- **Croqui DBC:** cada bloco contém todos os tratamentos uma vez; DIC: casualização global.
- **Croqui determinístico:** mesmo seed → mesmo layout.
- **RN-PROD:** `areaUtilM2 = numLinhasColhidas × espacamentoLinhasM × comprimentoColhidoM`; depois kg/parcela ÷ área × 10.000 = kg/ha. Espaçamento vem do experimento.
- **RN-FLUXO:** comercial sem orçamento aprovado **não** transiciona para `EmConducao`.
- **Sync:** push do mesmo UUID duas vezes → 1 registro.

## Casos de analytics (golden — ver estratégia)
- ANOVA DBC 1 fator: tabela, CV, médias e letras (Tukey/Scott-Knott) batem com fixture SAGRE dentro da tolerância.

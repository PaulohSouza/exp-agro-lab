# Exemplos e questões abertas

## Questões abertas (a confirmar com o usuário)
| ID | Questão | Impacto | Default proposto |
|---|---|---|---|
| ~~QA-01~~ ✅ | **RESOLVIDO:** área útil colhida calculada **por parcela na colheita** = `numLinhasColhidas × espacamentoLinhasM(experimento) × comprimentoColhidoM`. Usuário informa linhas e comprimento; espaçamento vem do cadastro. | Cálculo de produtividade kg/ha | — implementado no modelo |
| QA-02 | Quais **status** exatos do protocolo e quem transiciona cada um? | Fluxo/permissões | Inserindo → AprovadoCAD/RecusadoCAD → EmConducao → Concluído. |
| QA-03 | Delineamentos do MVP: DIC + DBC + Fatorial 2 já bastam, ou precisa split-plot cedo? | Escopo croqui/analytics | DIC, DBC, Fatorial 2 no MVP; split-plot/3 fatores depois. |
| QA-04 | O relatório PPTX deve ser **idêntico** ao modelo atual (mesmos slides) ou pode evoluir? | Marco 5 | Espelhar o modelo inicialmente. |
| QA-05 | Migrar dados do banco legado (`expagrolab.sql`) ou começar limpo? | Marco 0/1 | Começar limpo; importadores sob demanda. |
| QA-06 | iOS é obrigatório no mobile ou Android primeiro? | Marco 2 | Android primeiro. |

## Exemplo de experimento (cenário-âncora)
`PC1699 – Tidil Desfolhante`: Algodão, FM 944 GL, DBC, 5 tratamentos × 4 blocos = 20 parcelas, parcela 4,05 m × 7 m. Usado no [cenário E2E](../06-testes/02-casos-testes.md) e como seed.

## Exemplo de cálculo (RN-PROD) — conversão é no relatório
Experimento PC1699: parcela 4,05 m × 9 linhas → `espacamentoLinhasM = 4,05 / 9 = 0,45 m` (do cadastro).
**Atividade de colheita (apontamentos):** peso 8,5 kg, 4 linhas, 5 m → `areaUtilM2 = 4 × 0,45 × 5 = 9,0 m²`.
**No relatório (apresentação):** `8,5 / 9,0 × 10.000 ≈ 9.444 kg/ha`.

## Referências do repositório
- TCC: `docs/2024.1 - Projeto EXP-AGROLAB...pdf`, `docs/EXP-AGROLAB - PAULO - Apresentação...pdf`.
- Protocolo real: `docs/export atual - prot-1699-...pdf`.
- Banco legado: `BD/expagrolab.sql` (48 tabelas).
- Telas: `prints-projeto-exemplo/`.
- Base de telas/código: `projeto pesquisa comercial/` (Laravel + React Native).
- Modelo de relatório: `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx`.
- SAGRE: `/mnt/ds/drive/analytics/fmt-analytics-restrito/programming/projects/shiny/sagre-app`.

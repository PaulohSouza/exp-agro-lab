# 03 — Interfaces (telas e contratos)

## Telas-alvo (web) — espelham `prints-projeto-exemplo/`
### Lista de protocolos (`Tela de projetos em andamento.png`)
Tabela com filtros: Status, Safra, Área de Pesquisa, Cultura/Objeto, Local, Tipo Execução, Analista, Relatório Anexado. Colunas: Empresa/Título, Área+Safra, Status (com tempo), Cultura/Estágio, Local, Analista, Ações (ver, editar, anexos, excluir). Botão "Exportar Avaliações".

### Detalhe do protocolo — abas (`protocolo-consulta-detalhes.png`)
`Geral · Croqui · Tratamentos · Aplicações · Avaliações · Timeline · Manejo Comum · Resumo · Anexos`. Topo com ações: Gerar Etiquetas, Processar tarefas, Limpar Tarefas, Editar Protocolo, Gerar PDF, Modelo Impressão.
- **Geral:** alvo, analista, quadras/blocos, tipo de execução, área, cultura/cultivar, objetivo, semeadura, metodologia, local, ensaio, parcela (dim.), tratamentos, repetições, total parcelas, observações, justificativa.
- **Croqui:** grid de parcelas + "Editar Croqui" → modo **drag-drop** (`Editor-Croqui.png`).
- **Tratamentos:** por tratamento (T1..Tn), tabela de produtos (Seq, Produto, Modo Aplicação, Dose, Vol. Calda L/ha, Referência, Timing, Atividade) + descrição.
- **Avaliações:** lista por Seq/Avaliação/Data Prevista/Data Executada/Status/Timing + ações; botões Exportar Excel, Editar avaliação, **Lançar avaliações**. Suporta condicional/calendarizada/personalizada.

### Editor de croqui (`Editor-Croqui.png`)
Grid clicável; cada célula = parcela (nº, Tn, bloco, cor por tratamento, marca de início). Arrastar para realocar; ajustar linhas/colunas/sentido; salvar layout.

## Contratos de API (esboço, tipados via Zod/tRPC)
```
GET  /experimentos?filtros...              → lista
POST /experimentos                         → cria (Geral)
POST /experimentos/:id/fatores             → define fatores/níveis → deriva tratamentos
POST /experimentos/:id/croqui/gerar        → croqui automático (seed)
PUT  /experimentos/:id/croqui              → salva layout editado (drag-drop)
POST /experimentos/:id/avaliacoes          → define avaliação (+ unidade/fórmula)
POST /avaliacoes/:id/dados                 → lança dado por parcela (calcula saída)
POST /sync/pull                            → baixa protocolo+croqui+avaliações p/ mobile
POST /sync/push                            → envia lote de coletas (idempotente)
POST /experimentos/:id/analise             → roda analytics → resultados
POST /experimentos/:id/relatorio.pptx      → gera relatório no modelo
```

## Contrato de cálculo de avaliação (domain)
```ts
calcularSaida(input: {
  valorColetado: number
  unidadeColeta: string
  unidadeSaida: string
  formula: string            // ex: "(valor / areaUtil) * 10000"
  params: Record<string, number>  // ex: { areaUtil: 9.45 }
}): { valorSaida: number; unidadeSaida: string }
```
Caso-âncora produtividade (RN-PROD): `unidadeColeta=kg/parcela`, `unidadeSaida=kg/ha`, `formula="(valor/areaUtil)*10000"`.

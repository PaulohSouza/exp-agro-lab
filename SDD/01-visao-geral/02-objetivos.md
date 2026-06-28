# 02 — Objetivos do sistema

## Objetivo geral
Plataforma única para planejar, conduzir, analisar e reportar experimentos agronômicos e laboratoriais, genérica quanto ao objeto de estudo, com coleta mobile offline-first.

## Objetivos específicos
1. **Cadastrar experimentos de 1 a 3 fatores**, com tratamentos, delineamento e metadados (objetivo, cultura/objeto, local, safra, parcela, repetições).
2. **Gerar o croqui automaticamente** a partir do delineamento (DIC/DBC/fatorial), com **edição clique-e-arraste**, numeração de parcelas, blocos e ponto de início.
3. **Cadastrar avaliações** condicionais e calendarizadas, personalizadas, com **cálculo de unidade de saída** (ex.: produtividade coletada em kg/parcela → kg/ha pela área útil colhida).
4. **Suportar dois fluxos**: comercial (com orçamento/etapas de aprovação) e interno (TCC/ensaios sem custo).
5. **Coletar dados em campo offline-first** (mobile) com sincronização confiável.
6. **Analisar estatisticamente** (ANOVA, comparação de médias, fatorial, conjunta multi-local; paramétrico e não-paramétrico) com fidelidade ao SAGRE.
7. **Gerar relatório PPTX** no formato padrão a partir da análise.
8. Manter o **objeto de estudo genérico** via cadastros (categoria → subcategoria → objeto).

## Requisitos de alto nível
- Web (gestão/planejamento/análise/relatório) + Mobile (coleta de campo).
- Multiusuário com papéis e permissões; trilha de auditoria de status.
- Importação/compatibilidade com dados e formatos legados quando útil.

## Métricas de sucesso
- Criar um experimento completo (cadastro → croqui → avaliações) sem planilha externa.
- Coletar avaliações offline e sincronizar sem perda.
- Relatório gerado bate com o SAGRE dentro de tolerância definida nos golden tests.
- Tempo de montagem de croqui reduzido vs processo manual.

## Fora de escopo (inicial)
- Módulos financeiros completos (contas a pagar/receber, estoque) do sistema legado — entram só se o fluxo comercial exigir.
- Integrações externas (ERPs) além do necessário ao relatório.

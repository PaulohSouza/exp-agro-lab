# 03 — Multi-tenancy, compartilhamento e aprovações

Adendo aos [requisitos funcionais](01-requisitos-funcionais.md). IDs `RF-2x`.

## Instituição → Unidade/Laboratório → Usuários
- **RF-20** Cadastro de **Empresa/Instituição** (tenant raiz): a instituição **recebe um login administrador** que pode **criar e cadastrar usuários** vinculados a ela.
- **RF-21** Cadastro de **Unidade ou Laboratório** dentro da instituição (1:N). Usuários e experimentos podem ser associados a uma unidade.
- **RF-22** Usuários pertencem a uma instituição (e opcionalmente a uma unidade). O **admin da instituição** gerencia esses usuários (papéis, ativação).

## Compartilhamento de experimentos (entre usuários)
- **RF-23** O **dono do experimento** pode **compartilhá-lo** com outros usuários (preferencialmente da mesma instituição; convite por e-mail quando externo — espelha `sagre_compartilhar.R`).
- **RF-24** Permissão por compartilhamento: **`input`** (apenas lançar/inserir dados de avaliação) **ou `edit`** (editar o experimento — tratamentos, croqui, avaliações). Dono = controle total.
- **RF-25** Experimentos compartilhados **aparecem na timeline** dos usuários com quem foram compartilhados (visão agregada de "experimentos comigo").

## Aprovações no fluxo comercial (Ordem de Serviço)
- **RF-26** Ao migrar um experimento para o **fluxo comercial (gerar Ordem de Serviço/OS)**:
  - A **instituição pode ter um ou mais aprovadores internos**; a OS exige aprovação de aprovador(es) conforme política (todos ou N de M).
  - Além disso, exige **aprovação do cliente via e-mail**: o sistema envia um link/token de aprovação; o cliente aprova/recusa (registrar decisão, data, IP/identificação).
  - **Simulação de e-mail:** em dev/teste, o e-mail é **renderizado para arquivo/preview** (modo SIMULATE) em vez de enviado, e a decisão pode ser simulada por endpoint. Espelha/adapta o envio do SAGRE (blastula→nodemailer). Ver [05-seguranca](../05-seguranca/01-autenticacao-autorizacao.md) e [design de módulos](../04-design-detalhado/02-design-modulos.md#email).

## Regras
- **RN-TENANT:** todo dado é escopado por instituição; usuário só enxerga sua instituição + experimentos compartilhados com ele. Isolamento por `instituicaoId`.
- **RN-SHARE:** `input` não permite alterar estrutura (tratamentos/croqui/avaliações), só inserir `AvaliacaoDado`. `edit` permite alterar estrutura. Apenas o dono compartilha/revoga e gera OS.
- **RN-APROVA-OS:** OS só avança quando (aprovadores internos satisfeitos) **E** (cliente aprovou). Qualquer recusa volta o status e registra histórico/motivo.

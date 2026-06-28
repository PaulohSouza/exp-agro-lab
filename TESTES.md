# Plano de testes — EXP-AGROLAB

Checklist manual para validar o fluxo. Marque `[x]` ao passar. Resultados esperados em _itálico_.

## Pré-requisitos
```bash
pnpm install
pnpm --filter @exp/api build && pnpm --filter @exp/api db:seed
node apps/api/dist/main.js          # API :3001  (terminal 1)
pnpm --filter @exp/web dev          # Web :3000  (terminal 2)
```
- [ ] `curl localhost:3001/health` → _`{"status":"ok","db":"up",...}`_
- [ ] Abrir `http://localhost:3000/login`.

## 1. Autenticação e multi-tenancy
- [ ] Login **admin@demo.com / admin123** → _vai para `/protocolos`; header mostra "Admin Demo (admin)" e links Protocolos/Cadastros/Usuários/Instituição._
- [ ] Sair e logar **analista@demo.com / analista123** → _entra; **sem** links Usuários/Instituição (não é admin)._
- [ ] Login com senha errada → _erro "E-mail ou senha inválidos."_
- [ ] **Registrar instituição** (link no login) → cria nova → _entra como admin da nova instituição, lista de protocolos vazia (isolamento)._
- [ ] (admin) Página **Usuários** → cadastrar um usuário → _aparece na lista._ Como analista, tentar abrir `/usuarios` e criar → _bloqueado (403)._

## 2. Experimento — Geral e cadastros
- [ ] Abrir **PC1699 — Tidil Desfolhante**.
- [ ] Aba **Geral**: editar cultivar/objetivo, trocar Local/Safra/Delineamento, salvar → _"Geral salvo." e valores persistem ao recarregar._
- [ ] **Cadastros** (`/cadastros`): criar um Local novo, e um objeto de estudo (Categoria→Subcategoria→Objeto) → _aparecem; o objeto fica disponível no select da aba Geral._

## 3. Fatores → Tratamentos
- [ ] Aba **Fatores**: deixar 1 fator com 5 níveis → _"5 tratamentos derivados"._
- [ ] Adicionar 2º fator com 2 níveis → _prévia mostra **10 tratamentos**; salvar recria tratamentos._ ⚠️ _avisa que recria croqui e remove lançamentos._
- [ ] Voltar para 1 fator/5 níveis (para o restante do roteiro).

## 4. Croqui (drag-drop)
- [ ] Aba **Croqui** → _grade 5×4 (20 parcelas), colunas = blocos (A–D), ★ no início, cores por tratamento._
- [ ] **Arrastar** um tratamento sobre outro → _troca; aparece "alterações não salvas"._ Clicar **Salvar layout** → _"Layout salvo."_
- [ ] **Recasualizar** → _novo sorteio (DBC: cada bloco mantém os 5 tratamentos)._

## 5. Avaliações — lançar, análise, relatório (núcleo do teste)
- [ ] Aba **Avaliações** → _existe "Produtividade" (kg/parcela → kg/ha), com N lançamentos (seed já populou 20)._
- [ ] **Lançar** → _tabela de 20 parcelas; já vêm valores. Editar um valor e Salvar → "N lançamentos salvos"._ (input via **web** ✅)
- [ ] **Análise** → _ANOVA (DBC, n=20): F alto, p < 0.001, **CV ≈ 1,2%**, tratamento significativo; Bartlett homogêneo; médias com **letras** (T4 a … T1 e)._
- [ ] **Relatório** → _kg/ha por parcela (ex.: bruto 8,5 / área 9 ≈ 9.444) + médias por tratamento._
- [ ] Criar **nova avaliação** (ex.: "Nota visual", sem fórmula) → _aparece; "Lançar" mostra só o valor (sem linhas/comprimento)._

## 6. Exportações
- [ ] Cabeçalho → **Excel** → _baixa `.xlsx` com abas Geral/Tratamentos/Croqui/Dados._
- [ ] Cabeçalho → **Relatório PPTX** → _baixa `.pptx`: capa (azul) + resumo + slide de análise (tabela ANOVA + médias/letras + gráfico de barras)._

## 7. Compartilhamento (input × edit)
- [ ] Aba **Compartilhar** (como dono) → compartilhar com **analista@demo.com** nível **input** → _aparece na lista; (mesma instituição já vê)._ Para testar isolamento real, use um usuário de **outra instituição**:
  - [ ] Compartilhar com um e-mail **não cadastrado** → _"Convite enviado (e-mail simulado)"; arquivo em `apps/api/email-previews/`._
  - [ ] Logado como o colaborador **input**: editar Geral → _bloqueado (403)_; **lançar** avaliação → _permitido_.
  - [ ] Subir para **edit** → _passa a editar._ **Revogar** → _colaborador perde acesso._

## 8. Ordem de Serviço (fluxo comercial — RF-26)
- [ ] Aba **Geral**: mudar ensaio para **comercial**, salvar.
- [ ] (admin) **Instituição**: política **n_de_m**, N=1; adicionar **analista** como aprovador.
- [ ] Aba **Ordem de Serviço** → **Nova OS** → **Submeter** com e-mail do cliente → _status "Aguardando aprovação interna"._
- [ ] Logado como **analista** (aprovador) → **Aprovar (interno)** → _status "Aguardando aprovação do cliente"; e-mail simulado gerado em `email-previews/`._
- [ ] Abrir o **link de aprovação** (botão na OS, ou `/aprovacao/<token>`) → **Aprovar** → _"Decisão registrada"; OS fica **Aprovada**._
- [ ] Testar **Recusar** num novo ciclo → _OS **Recusada**._

## 9. Lista e timeline compartilhada
- [ ] `/experimentos` → _lista com filtros visuais, badge **compartilhado** e "dono: X" nos itens compartilhados._

## 10. API (smoke opcional, via curl)
```bash
TOK=$(curl -s -XPOST localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@demo.com","senha":"admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
curl -s localhost:3001/experimentos -H "Authorization: Bearer $TOK" | head -c 200   # lista
# /experimentos sem token → 401
```

## 11. Mobile (quando tiver device/emulador)
```bash
cd apps/mobile && npm install
export EXPO_PUBLIC_API_BASE="http://SEU_IP_LAN:3001"   # IP da máquina, não localhost
npx expo start                                          # Expo Go
```
- [ ] Login (analista@demo.com) → lista de protocolos.
- [ ] Abrir protocolo → digitar valores (offline) → **Sincronizar (N)** → _aplicados; conflitos avisados._
- [ ] Desligar Wi-Fi, lançar, religar, sincronizar → _dados sobem; reenvio não duplica._

## Bugs / observações (anotar aqui)
- …

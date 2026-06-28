# STATUS do projeto — EXP-AGROLAB

> **Handoff para retomar em nova conversa.** Última atualização: 28/06/2026. Branch `main`.
> Ao retomar com o Claude: leia [CLAUDE.md](CLAUDE.md) + este arquivo + [SDD/README.md](SDD/README.md). O roadmap detalhado está em [SDD/01-visao-geral/03-roadmap.md](SDD/01-visao-geral/03-roadmap.md).

## 1. O que é
Sistema de gestão de experimentos agronômicos e laboratoriais: experimentos de 1–3 fatores, tratamentos, croqui clique-e-arraste, avaliações (valor bruto), dois fluxos (interno/comercial), multi-instituição com compartilhamento, análise estatística e relatório PPTX. Objeto de estudo genérico (cultura, máquina, pessoa/atleta…).

## 2. Stack
Monorepo TypeScript (pnpm + Turborepo):
- `packages/domain` — núcleo puro: croqui (DIC/DBC + **split-plot**), RN-PROD (produtividade), fluxo de status, helpers de sync. **30 testes**.
- `packages/analytics` — estatística pura: ANOVA, CV, Bartlett, LSD/letras, distribuições F/t/χ². **9 testes**.
- `apps/api` — NestJS + Prisma + **MySQL** (`expagrolab_dev`). JWT/bcrypt.
- `apps/web` — Next.js (App Router), tema azul do TCC.
- `apps/mobile` — Expo + expo-router (offline-first). **Fora do workspace pnpm** (usa npm).

## 3. O que está PRONTO ✅
| Área | Estado | Onde |
|---|---|---|
| Monorepo + DB + seed | ✅ | `pnpm i`, migração `init`, seed PC1699 (20 parcelas com dados) |
| Experimento (Geral editável) | ✅ | web `/experimentos/[id]` aba Geral; `PUT /experimentos/:id` |
| Cadastros (objeto genérico, local, safra, área, delineamento, produto, atividade) | ✅ | web `/cadastros`; `CadastrosModule` |
| Fatores 1–3 → tratamentos (produto cartesiano) | ✅ | aba Fatores; `POST /experimentos/:id/fatores` |
| Tratamentos com produtos/dose/modo/volume/timing/atividade | ✅ | aba Tratamentos; `TratamentosModule` |
| Croqui automático (DIC/DBC) + **drag-drop** + recasualizar | ✅ | aba Croqui; `gerarCroqui`/`salvarCroqui` |
| Avaliações: cadastro + **lançar valor bruto** (web) | ✅ | aba Avaliações → Lançar; `AvaliacoesModule` |
| Relatório de produtividade (kg/ha no relatório, não na coleta) | ✅ | aba Avaliações → Relatório |
| **Análise estatística** (ANOVA DIC/DBC, CV, Bartlett, LSD/letras) | ✅ fase A | aba Avaliações → Análise; `GET /avaliacoes/:id/analise` |
| **Relatório PPTX** (capa, resumo, ANOVA+médias+gráfico) | ✅ fase A | botão "Relatório PPTX"; `GET /experimentos/:id/relatorio.pptx` |
| **Exportação Excel** | ✅ | botão "Excel"; `GET /experimentos/:id/export.xlsx` |
| **Autenticação** (JWT/bcrypt) + registro de instituição | ✅ | `/login`; `AuthModule` |
| **Multi-tenancy** (escopo por instituição) + gestão de usuários | ✅ | `/usuarios`; `garantirAcesso` |
| **Compartilhamento** input/edit + convite por e-mail simulado | ✅ | aba Compartilhar; `CompartilhamentoModule` |
| **Ordem de Serviço** (aprovação interna por política + cliente por e-mail/token) | ✅ | aba Ordem de Serviço; `/instituicao`; `/aprovacao/[token]` |
| **Sincronização offline** (pull/push idempotente + conflito) | ✅ | `SyncModule`; helpers em `packages/domain` |
| **App mobile** (login, protocolos, coleta offline, sincronizar) | ⚠️ scaffold | `apps/mobile` — compila; **não testado em device** |
| **Papéis (RBAC) + Dashboard** (fatia 1) | ✅ fatia 1 | enum `Papel` (7) + `Departamento` no schema; JWT carrega `papel`; `GET /dashboard` escopado; tela `/dashboard`. Ver [SDD 07](SDD/04-design-detalhado/07-dashboard.md) / [RBAC](SDD/05-seguranca/03-papeis-rbac.md) |
| **RBAC fatia 2 parte 1** (backend + UI) | ✅ | guard `@RequirePapel` (admin_sistema passa sempre); CRUD `/departamentos` (+ `GET /departamentos/unidades`); `PUT /usuarios/:id` (atribui papel/depto/unidade); dashboard refina escopo por depto/área. UI: card de Departamentos em `/instituicao`; seletores de papel/depto/área em `/usuarios`. |
| **RBAC fatia 2 parte 2** | ✅ | **super-admin global de fato** (`admin_sistema` vê/abre todas as instituições — `listar`/`garantirAcesso` ignoram o tenant; lista mostra a instituição); **responsável de coleta** (`ExperimentoResponsavel`, rotas `/experimentos/:id/responsaveis`) entra no escopo "atribuídos" do painel. UI na aba Compartilhar. Super-admin demo: `root@sistema.com`/`root123`. |
| **Web responsiva** (mobile/tablet) | ✅ | `globals.css` (viewport, box-sizing, `.tabela-scroll`/`.scroll-x`); tabelas roláveis, header/abas sem corte, grids `auto-fit`, containers fluidos. Auditoria das 16 telas. |

## 3.1 Em andamento — croqui de 2+ fatores (esquema)
Distinção **fatorial × parcela subdividida (split-plot)**. Domínio implementado e testado em `packages/domain/croqui.ts` (`gerarParcelaSubdividida`, `validarParcelaSubdividida`, `trocarSubparcela`, `trocarParcelaPrincipal`) — **30 testes** no domain. Design em [SDD/04-design-detalhado/06-croqui-esquemas.md](SDD/04-design-detalhado/06-croqui-esquemas.md). **Falta:** campos `esquema`/`grupoPrincipal` no schema Prisma + API, UX de arraste em 2 níveis no web, e ramificação da ANOVA (split-plot tem 2 erros → liga com analytics fase B).

## 4. Pendências / limitações conhecidas
- **Analytics fase A usa LSD (Fisher).** O SAGRE usa **Tukey/Scott-Knott** por padrão → as **letras podem divergir**. Falta a **fase B**: Tukey/Scott-Knott (qtukey), fatorial 2–3, transformações, não-paramétrico, conjunta, e **golden tests vs SAGRE** (precisa de outputs do R).
- **PPTX fase A** tem layout próprio; falta aproximar do `modelo saida relatório - SAGRE - EXP-AGROLAB.pptx`.
- **App mobile não foi rodado** (sem device/emulador no ambiente). Compila por `tsc`. Validar com Expo Go.
- E-mails em modo **SIMULATE** (arquivos em `apps/api/email-previews/`), não envia de verdade.
- Sem auth real de senha forte/refresh-token rotation; JWT simples (dev).

## 5. Mapa do código
- **API módulos** (`apps/api/src/`): `auth`, `experimentos`, `cadastros`, `tratamentos`, `avaliacoes`, `usuarios`, `compartilhamento`, `instituicao`, `ordem-servico`, `sync`, `export`, `relatorio`, `email`, `prisma`, `health`.
- **Web páginas** (`apps/web/app/`): `/`, `/login`, `/experimentos`, `/experimentos/[id]` (7 abas), `/cadastros`, `/usuarios`, `/instituicao`, `/aprovacao/[token]`.
- **Schema**: `apps/api/prisma/schema.prisma`. **Seed**: `apps/api/prisma/seed.ts`.

## 6. Como rodar (resumo rápido)
```bash
# pré: Node ≥20, pnpm 9, MySQL local. Banco/credenciais já em apps/api/.env (expagrolab_dev).
pnpm install
pnpm --filter @exp/api exec prisma migrate dev   # aplica migrações (1ª vez)
pnpm --filter @exp/api db:seed                    # cenário PC1699 (20 parcelas com dados)
node apps/api/dist/main.js                         # API em :3001  (rode 'pnpm --filter @exp/api build' antes)
pnpm --filter @exp/web dev                         # Web em :3000 → http://localhost:3000/login
```
Login demo: **admin@demo.com / admin123** (gestão da instituição) · **analista@demo.com / analista123** · **root@sistema.com / root123** (super-admin global).
Mobile: ver `apps/mobile/README.md` (`EXPO_PUBLIC_API_BASE` = IP da máquina).

## 7. Testes a fazer
Ver o checklist completo em **[TESTES.md](TESTES.md)**.

## 8. Próximos passos sugeridos (escolher na retomada)
1. **Feedback dos testes** → corrigir o que aparecer.
2. **Analytics fase B** — Tukey/Scott-Knott + **golden tests vs SAGRE** (trazer outputs do R de 1–2 experimentos).
3. **Relatório fase B** — layout fiel ao modelo PPTX.
4. **App mobile** — testar em device e iterar.
5. **Endurecimento** — segurança (refresh token, RBAC fino), observabilidade, CI no GitHub.

## 9. Releases
`v0.1.0` (MVP-1+Auth+Compartilhamento+OS) · `v0.2.0` (Marco 1 completo) · `v0.3.0` (sync) · `v0.4.0` (mobile) · `v0.5.0` (analytics) · `v0.6.0` (relatório PPTX). Histórico: https://github.com/PaulohSouza/exp-agro-lab/releases

## 10. Infra / notas de ambiente
- `pnpm` symlinkado em `~/.local/bin`. MySQL local: root via socket (`mysql -u root`); app usa user `expagrolab` em `expagrolab_dev`/`expagrolab_shadow` (NÃO usar schema `sagre`).
- Push/release liberados (`paulosouzafmt` é colaborador). Fluxo: por etapa → commit, push, release.

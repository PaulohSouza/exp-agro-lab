# EXP-AGROLAB

Sistema de gestão de **experimentos agronômicos e laboratoriais**. Cadastra experimentos de **1 a 3 fatores**, tratamentos, delineamento, **croqui clique-e-arraste**, avaliações (numéricas e documentais) e atividades, em **dois fluxos** (comercial com ordem de serviço / interno sem custo). O objeto de estudo é **genérico** (cultura, máquina, pessoa/atleta…). Saída: **análise estatística** (portada do SAGRE, sem R em produção) e **relatório PPTX**.

| | |
|---|---|
| **Release atual** | **[v0.13.0](https://github.com/PaulohSouza/exp-agro-lab/releases/tag/v0.13.0)** |
| **Branches** | `main` (produção/releases) · `develop` (integração) |
| **Estado / handoff** | **[STATUS.md](STATUS.md)** — leia primeiro para retomar |
| **Design** | **[SDD/](SDD/README.md)** — fonte de verdade de escopo, dados e regras |
| **Última consolidação** | 14/09/2026 |

---

## Sumário

1. [O que o sistema faz](#o-que-o-sistema-faz)
2. [Stack](#stack)
3. [Estrutura do monorepo](#estrutura-do-monorepo)
4. [Pré-requisitos](#pré-requisitos)
5. [Como rodar](#como-rodar)
6. [Contas de demonstração](#contas-de-demonstração)
7. [Mapa da aplicação](#mapa-da-aplicação)
8. [Domínio e regras](#domínio-e-regras)
9. [Análise estatística](#análise-estatística)
10. [Testes](#testes)
11. [Documentação](#documentação)
12. [Releases e fluxo git](#releases-e-fluxo-git)
13. [Próximos passos](#próximos-passos)

---

## O que o sistema faz

Fluxo web completo **input → coleta → análise → relatório**, com multi-instituição.

- **Experimento (protocolo):** 1–3 fatores, produto cartesiano de tratamentos, dois esquemas de croqui (**fatorial** ou **parcela subdividida / split-plot**), drag-and-drop e recasualização.
- **Cadastros:** objeto de estudo genérico (categoria → subcategoria → objeto), local, safra, área, delineamento, produto, atividade.
- **Avaliações:** valor bruto por parcela; **numérica** (entra na ANOVA) ou **documental** (foto/texto, fora da ANOVA). Catálogo multi-escopo (sistema / instituição / departamento) com pré-requisitos transitivos. Coleta em lote e grupos de coleta.
- **Atividades:** registro geral do experimento (ação ou apontamento). Campo `ARQUIVO` para foto geral do ensaio. Cronograma de **marcos** (implantação, semeadura, colheita…). Área útil da colheita vem da atividade Colheita (RN-PROD).
- **Análise:** ANOVA DIC/DBC, split-plot (2 erros), fatorial 2–3 com desdobramento (duplo e triplo), transformações (√/log/Box-Cox), Kruskal-Wallis/Friedman, conjunta multi-local (G×A), Shapiro-Wilk + Bartlett com **rota sugerida em 1 clique**, Tukey / Scott-Knott / LSD. Validada por **27 golden tests** contra a engine real do SAGRE (`ExpDes.pt`).
- **Saídas:** relatório **PPTX** (layout fiel ao modelo SAGRE, marca da instituição) e exportação **Excel**.
- **Acesso:** JWT + refresh-token (rotação e detecção de reuso), senha forte, **7 papéis RBAC**, dashboard, compartilhamento input/edit, ordem de serviço (aprovação interna + cliente por token).
- **Campo:** sync offline (pull/push idempotente) e app **Expo** (scaffold; falta validar em device).
- **Infra:** Docker Compose (MySQL + API + Web + **MinIO**), CI (lint, format, typecheck, unit, e2e), observabilidade (`x-request-id` + log JSON).

---

## Stack

Monorepo **TypeScript** com **pnpm 9** + **Turborepo**. Sem R em produção.

| Camada | Tecnologia | Pasta |
|---|---|---|
| API | NestJS + Prisma + **MySQL 8** | `apps/api` |
| Web | Next.js (App Router) + React | `apps/web` |
| Mobile | Expo / React Native (offline-first) | `apps/mobile` — **fora** do workspace pnpm |
| Domínio | Tipos + regras + Zod (puro) | `packages/domain` |
| Estatística | Port TS do SAGRE + golden tests | `packages/analytics` |
| Storage | S3-compatível (**MinIO** em dev) com fallback local | `apps/api` `StorageModule` |
| Relatório | pptxgenjs · exceljs | `apps/api` |

Tema visual do TCC: navy `#1F2940`, sidebar `#141B2D`, accent sky `#4EC2F0`. Ver [design system](SDD/04-design-detalhado/05-design-system.md).

---

## Estrutura do monorepo

```
exp-agro-lab/
├── apps/
│   ├── api/          # NestJS · Prisma · JWT · storage · PPTX/Excel
│   ├── web/          # Next.js · telas do fluxo
│   └── mobile/       # Expo (npm, não pnpm)
├── packages/
│   ├── domain/       # croqui, RN-PROD, natureza, catálogo, sync, fluxo
│   └── analytics/    # ANOVA, fatorial, split, transform, não-param, golden/
├── e2e/              # Playwright Python (13 suites)
├── SDD/              # Software Design Document
├── .github/workflows/ci.yml
├── docker-compose.yml
├── STATUS.md         # handoff (começar por aqui)
├── DEVELOPMENT.md    # comandos do dia a dia
├── TESTES.md         # checklist manual
└── CLAUDE.md         # contexto para o agente
```

`apps/mobile` está excluído do `pnpm-workspace.yaml` (Metro + symlinks). Use `npm` dentro dessa pasta.

---

## Pré-requisitos

- **Node.js ≥ 20** (CI usa 22)
- **pnpm 9** (`npm i -g pnpm@9` — no ambiente local costuma estar em `~/.local/bin`)
- **MySQL 8** **ou** Docker (Compose sobe o banco)
- Python 3.12 + Playwright — só para e2e local

Banco da aplicação: schemas **`expagrolab_dev`** / **`expagrolab_shadow`**. **Não** usar o schema `sagre`. Credenciais em `apps/api/.env` (não versionado); copie de `apps/api/.env.example`.

---

## Como rodar

### Opção A — Docker (stack completo)

Sobe **MySQL + MinIO + API (:3001) + Web (:3000)**. Não precisa de MySQL/Node no host.

```bash
docker compose up -d --build
docker compose logs -f api          # migrate + seed + boot
# Web:  http://localhost:3000/login
# MinIO console: http://localhost:9001  (minioadmin / minioadmin)
docker compose down                 # -v apaga o volume do MySQL
```

A API aplica `prisma migrate deploy` + seed no start. O MySQL do container **não é exposto** ao host (evita conflito com o MySQL local). Detalhe em [DEVELOPMENT.md](DEVELOPMENT.md).

### Opção B — local (hot-reload)

```bash
pnpm install
# configure apps/api/.env (DATABASE_URL, JWT_SECRET, …)
pnpm --filter @exp/api exec prisma migrate dev
pnpm --filter @exp/api db:seed                    # cenário PC1699 + sandbox
pnpm --filter @exp/api build && node apps/api/dist/main.js   # :3001
pnpm --filter @exp/web dev                        # :3000
```

Health: `curl localhost:3001/health` → `{"status":"ok","db":"up",...}`.

Para fotos no MinIO local (sem Compose da API), suba só o storage:

```bash
docker compose up -d minio minio-init
# e preencha S3_* em apps/api/.env (ver .env.example)
```

Sem `S3_ENDPOINT`, o upload cai no **fallback local** (`UPLOAD_DIR` + `GET /uploads/*`).

### Mobile

```bash
cd apps/mobile
npm ci                              # obrigatório se o node_modules foi tocado
export EXPO_PUBLIC_API_BASE="http://SEU_IP_LAN:3001"   # não use localhost
npx expo start                      # Expo Go
```

Ver [apps/mobile/README.md](apps/mobile/README.md). Runtime **ainda não validado em device**.

---

## Contas de demonstração

| Papel | E-mail | Senha | Uso |
|---|---|---|---|
| Gestão da instituição | `admin@demo.com` | `admin123` | CRUD, usuários, política, catálogo |
| Analista | `analista@demo.com` | `analista123` | coleta / análise |
| Super-admin global | `root@sistema.com` | `root123` | vê todas as instituições |

O seed cria o protocolo **PC1699** (20 parcelas com dados) e o sandbox **SIM 2-Fatores**.

---

## Mapa da aplicação

### Web (`apps/web/app/`)

| Rota | Função |
|---|---|
| `/login` | Entrar e registrar instituição |
| `/dashboard` | Painel escopado por papel / depto / área |
| `/experimentos` | Lista de protocolos |
| `/experimentos/[id]` | Detalhe: Geral · Fatores · Tratamentos · Croqui · Avaliações · Atividades · Compartilhar · OS |
| `/cadastros` | Objeto de estudo, local, safra, área, delineamento, produto |
| `/catalogo` | Modelos de avaliação, atividade e grupos de coleta |
| `/usuarios` | Gestão de usuários (papel, depto, unidade) |
| `/instituicao` | Política de OS, aprovadores, departamentos |
| `/analise-conjunta` | ANOVA G×A multi-local |
| `/aprovacao/[token]` | Decisão do cliente (público) |

### API (`apps/api/src/`)

Módulos: `auth`, `experimentos`, `cadastros`, `tratamentos`, `avaliacoes`, `atividades`, `modelo-avaliacao`, `grupos-coleta`, `usuarios`, `compartilhamento`, `instituicao`, `ordem-servico`, `sync`, `export`, `relatorio`, `dashboard`, `departamentos`, `dominios`, `storage`, `email`, `prisma`.

Auth: `POST /auth/login` e registro devolvem `access_token` + `refresh_token`. `POST /auth/refresh` rotaciona o refresh e **revoga a família** se detectar reuso. `POST /auth/logout` invalida. Upload: `POST /uploads` (tipo + 10 MB). Análise: `GET /avaliacoes/:id/analise?metodo=&transformacao=&naoParametrico=`. Relatório: `GET /experimentos/:id/relatorio.pptx`.

### Schema

Fonte: `apps/api/prisma/schema.prisma`. Seed: `apps/api/prisma/seed.ts`. Enums de domínio também em `DominioValor` (D6). Padrão de nomenclatura: [SDD/03-arquitetura/04-padroes-desenvolvimento.md](SDD/03-arquitetura/04-padroes-desenvolvimento.md).

---

## Domínio e regras

Regras de negócio vivem em **`packages/domain`**, não nas telas.

| Módulo | Responsabilidade |
|---|---|
| `croqui.ts` | DIC/DBC + split-plot (`gerarParcelaSubdividida`, troca de subparcela / parcela principal) |
| `avaliacao.ts` | RN-PROD (kg/ha no relatório), fórmula, `AvaliacaoNatureza`, `entraNaAnalise`, `dedupLancamentos` |
| `modeloAvaliacao.ts` | visibilidade por escopo, RBAC de catálogo, fechamento transitivo de pré-requisitos |
| `atividade.ts` | validação de apontamento, marcos padrão, `statusMarco` |
| `fluxo.ts` | comercial × interno (status do protocolo) |
| `sync.ts` | chave idempotente, LWW, dedup de lote |

**Decisão de enquadramento (fotos):** foto **de parcela** = avaliação documental (`FOTO`); foto **geral do ensaio** = atividade com campo `ARQUIVO`. Design: [SDD 09](SDD/04-design-detalhado/09-fotos-coleta-parcial-timeline.md).

---

## Análise estatística

`packages/analytics` reescreve a engine do SAGRE em TypeScript. R **não** roda em produção; a referência golden é gerada uma vez (`packages/analytics/golden/gen-reference.R`) e versionada. A CI compara TS × JSON sem R.

Coberto: ANOVA 1 fator · split-plot 2 erros · fatorial 2–3 + desdobramento duplo/triplo · √ / log / Box-Cox · Kruskal-Wallis+Dunn / Friedman+Nemenyi · conjunta G×A · Shapiro-Wilk + Bartlett + seleção de rota · Tukey / Scott-Knott / LSD.

**107 testes** no pacote (80 unitários + **27 golden** vs `ExpDes.pt` / `agricolae` / `MASS`). Única lacuna golden: **conjunta multi-local** (nenhuma planilha do SAGRE-app tem >1 local). Detalhe: [STATUS §3.1–3.7](STATUS.md) e [sagre-analytics](SDD/08-anexos/sagre-analytics.md).

---

## Testes

```bash
pnpm test            # domain + analytics (Vitest)
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

| Camada | Quantidade | Onde |
|---|---|---|
| Domínio | **62** | `packages/domain` |
| Analytics | **107** (27 golden) | `packages/analytics` |
| E2E | **13 suites** | `e2e/*.py` |

O job e2e do CI sobe MySQL + API + Web e roda: `test_catalogo`, `test_catalogo_a5`, `test_atividades`, `test_grupos`, `test_periodo_marcos`, `test_auth_refresh`, `test_avaliacao_documental`. As demais (fatorial, split-plot, transformação, não-paramétrico, conjunta, pontos amostrais) existem para regressão local — ver [e2e/README.md](e2e/README.md).

Checklist manual: [TESTES.md](TESTES.md).

---

## Documentação

| Documento | Para quê |
|---|---|
| **[STATUS.md](STATUS.md)** | Handoff: o que está pronto, pendências, como retomar |
| **[SDD/README.md](SDD/README.md)** | Software Design Document (índice) |
| [Padrão de desenvolvimento](SDD/03-arquitetura/04-padroes-desenvolvimento.md) | Nomenclatura, camadas, Zod, banco — **obrigatório** em código novo |
| [Roadmap](SDD/01-visao-geral/03-roadmap.md) | Marcos 0–6 e progresso |
| [SDD 08 catálogo](SDD/04-design-detalhado/08-catalogo-avaliacoes.md) | Avaliação × atividade, grupos, pré-requisitos |
| [SDD 09](SDD/04-design-detalhado/09-fotos-coleta-parcial-timeline.md) | Documental (E ✅) · coleta parcial (F ⏳) · timeline (G ⏳) |
| [Analytics SAGRE](SDD/08-anexos/sagre-analytics.md) | Rotas e métodos portados |
| [RBAC](SDD/05-seguranca/03-papeis-rbac.md) | 7 papéis |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Comandos do monorepo e Compose |
| [MELHORIAS.md](MELHORIAS.md) | Achados da simulação ponta-a-ponta (M1–M5) |
| [CLAUDE.md](CLAUDE.md) | Contexto curto para o agente |
| [Glossário](SDD/08-anexos/glossario.md) | Protocolo, parcela, bloco, croqui, timing… |

**Idioma:** documentação, UI e termos de domínio em **português**; termos técnicos/estruturais em inglês (`Service`, `createdAt`). UI e output sempre em PT.

---

## Releases e fluxo git

Histórico: https://github.com/PaulohSouza/exp-agro-lab/releases

| Tag | Conteúdo |
|---|---|
| `v0.7.0` | Catálogo de avaliações/atividades + período/marcos + coleta agrupada |
| `v0.8.0` | CI + padronização de código |
| `v0.9.0` | Croqui split-plot |
| `v0.10.0` | Analytics fase B/C |
| `v0.11.0` | Desdobramento triplo + rota em 1 clique + golden vs SAGRE + PPTX fase B |
| `v0.12.0` | Pontos amostrais (M1/M2/M4) + endurecimento + Docker + refresh no web |
| **`v0.13.0`** | **Avaliação documental (foto/texto) + storage S3/MinIO + campo ARQUIVO** |

**Fluxo:** feature → PR → `develop` → `main` → tag/release. A `main` é a branch padrão e a origem das tags. Push em `main` ou `develop` dispara o CI.

Convenções: código novo segue o [padrão de desenvolvimento](SDD/03-arquitetura/04-padroes-desenvolvimento.md). Datas relativas nos docs viram absolutas (início do projeto: 28/06/2026).

---

## Próximos passos

Prioridade atual (STATUS §8):

1. **Demanda F — coleta parcial** (spec pronta no [SDD 09](SDD/04-design-detalhado/09-fotos-coleta-parcial-timeline.md); começar por F1 schema)
2. **Demanda G — timeline**
3. **Mobile em device** (Expo Go; `npm ci` em `apps/mobile` antes)
4. RBAC fino + auditoria
5. **M3** — UI web de N pontos por parcela ([MELHORIAS.md](MELHORIAS.md))
6. Golden da **conjunta multi-local** (bloqueado por falta de dado)

---

## Licença e crédito

Repositório privado de desenvolvimento. Base conceitual: TCC EXP-AgroLab (tema azul) e pipeline estatístico do **SAGRE**. Contato do repositório: [PaulohSouza/exp-agro-lab](https://github.com/PaulohSouza/exp-agro-lab).

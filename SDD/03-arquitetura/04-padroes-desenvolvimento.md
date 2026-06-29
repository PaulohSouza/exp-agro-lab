# Padrão de Desenvolvimento — EXP-AGROLAB

> Convenções de código, banco de dados e camadas. **Fonte única** do "como escrever código" no projeto.
> Adaptado do esboço `docs/resumo-padrao-desenvolvimento.docx` (que era para **Laravel/PHP**) para a nossa stack **TypeScript** (NestJS + Prisma + Next.js + React Native).
> Lido junto com [CLAUDE.md](../../CLAUDE.md). Última atualização: 29/06/2026.

---

## 0. Decisões deste padrão (confirmadas)

Estas são as escolhas que definem todo o resto. **Confirmadas pelo autor.**

| # | Decisão | Escolha adotada | Por quê |
|---|---|---|---|
| **D1** | Idioma dos **identificadores** | **PT no domínio + EN no técnico**; **UI/output sempre PT** | Preserva o vocabulário agronômico do TCC/relatório (parcela, tratamento, croqui) e respeita as libs (Service, createdAt). Formaliza o CLAUDE.md. |
| **D2** | Casing de **tabelas/colunas** | **Default do Prisma** (model PascalCase, coluna camelCase, **sem `@map`**) | Idiomático em Prisma/TS, **zero migração de renomeação**. O `snake_case` do esboço era convenção do Eloquent/Laravel. |
| **D3** | Valores de **enum** | **`UPPER_SNAKE_CASE`** | Deixa claro que são constantes. Antes havia mistura (`interno` vs `Inserindo`). |
| **D4** | **Booleanos** | Prefixo **`is`/`has`/`can`/`should`** | Convenção TS. Antes havia mistura (`ativo`, `isInicio`, `eCultura`). |
| **D5** | **Estratégia de refactor** | **Incremental** (documenta agora, trava o novo via lint, refatora o legado ao tocar) | Não trava o roadmap; menor risco que um big-bang. Ver §12. |
| **D6** | **Significado de enumerados vive no banco** | Todo valor enumerado tem **referência legível no banco** (rótulo/descrição), via tabela de domínio. Enums seguem existindo como tipo. | O significado de cada código é **dado**, consultável pelo usuário/admin — não fica só no código. Ver §4.9. |

> **Importante:** D2/D3/D4 implicam **migrações de banco** no legado. Por D5, isso é feito **aos poucos**. Código **novo** já nasce no padrão.

---

## 1. Princípios

Tradução dos princípios do esboço para NestJS/TS:

| Esboço (Laravel) | Aqui (NestJS/TS) |
|---|---|
| Controllers finos; regras em Services/Actions | **Controller fino** → **Service** (orquestra) → **`packages/domain`** (regra pura). Regra de negócio **nunca** no controller nem na tela. |
| Validação em FormRequest | Validação na borda com **Zod** (DTO/schema), via pipe. Ver §5.2. |
| Use Resources para respostas | **Resposta serializada** por tipo explícito (DTO de saída), sem vazar entidade Prisma crua quando houver campos sensíveis (ex.: `senhaHash`). |
| Transações com `DB::transaction()` | **`prisma.$transaction(...)`** para operações multi-tabela. |
| Enums para constantes de domínio | **Enums do Prisma** (persistidos) e/ou `enum`/union TS no domínio. Nada de "magic strings". |
| Dependency Injection; evitar `new` | **DI do NestJS** (`@Injectable`, construtor). `new` só para exceções (`new NotFoundException`), value objects e libs (`new ExcelJS`). |
| Laravel Pint + PSR-12 | **ESLint + Prettier** compartilhados no monorepo. Ver §10. |

**Princípio-mor do projeto:** o **domínio é a fonte da verdade**. Geração de croqui, cálculo de unidade de saída, condições de avaliação e visibilidade por escopo vivem em `packages/domain`, testados de forma pura — não nas telas nem nos services.

---

## 2. Idioma (D1)

| Categoria | Idioma | Exemplo |
|---|---|---|
| **Termos de domínio** (entidades e seus campos de negócio) | **Português** | `Experimento`, `Parcela`, `Tratamento`, `Avaliacao`, `bloco`, `numero`, `dose`, `metodologia` |
| **Termos técnicos / estruturais** | **Inglês** (convenção da lib) | `Service`, `Module`, `Controller`, `Repository`, `Guard`, `Dto`, `id`, `createdAt`, `updatedAt` |
| **Booleanos, helpers genéricos** | **Inglês** | `isAtivo`, `hasColheita`, `canEdit`, `mapToDto`, `resolvePrereqs` |
| **UI, mensagens, labels, erros de API** | **Português, sempre** | `"Avaliação criada"`, `"Você não tem permissão"`, botão `"Adicionar do catálogo"` |
| **Comentários e documentação** | **Português** | `// área útil vem da atividade Colheita` |

**Regra prática:** se a palavra existe no glossário do domínio ([SDD/08-anexos/glossario.md](../08-anexos/glossario.md)), use-a em PT. Se é vocabulário de framework/infra, use o termo em EN da lib.

**Documentação no código em pt-BR.** Comentários, **JSDoc/TSDoc**, mensagens de commit e docs de módulo são escritos em **português**, para facilitar a manutenção pela equipe. Documente o *porquê* (regra de negócio, RN-XX, decisão), não o óbvio. Os **identificadores** seguem D1 (o nome do símbolo pode ser EN técnico; a explicação dele é em PT).

```ts
/**
 * Calcula a área útil (m²) do experimento a partir da atividade de Colheita.
 * RN-PROD / C5: a área é única para todas as parcelas e vem dos campos
 * `linhas`/`comprimento` da atividade, não de AvaliacaoDado.
 */
export function areaUtilDoExperimento(...) { /* ... */ }
```

> Pendência aberta por D1: o model **`User`** destoa (resto do domínio é PT). Ver §12 — candidato a `Usuario` na refatoração incremental.

---

## 3. Convenções de nomenclatura (geral)

Tabela do esboço, adaptada ao TS:

| Item | Padrão | Exemplo |
|---|---|---|
| Classe / Interface / Type | `PascalCase` | `AvaliacaoService`, `LancamentoDto` |
| Model Prisma (entidade) | `PascalCase` singular | `Experimento`, `ModeloAvaliacao` |
| Método / função | `camelCase` | `criarAvaliacao`, `resolvePrereqs` |
| Variável / parâmetro | `camelCase` | `totalParcelas` |
| Propriedade / campo | `camelCase` | `criadoPor`, `dataPrevista` |
| Booleano | `camelCase` com `is/has/can/should` | `isAtivo`, `hasColheita` |
| Constante de módulo | `UPPER_SNAKE_CASE` | `MAX_PARCELAS` |
| Enum (tipo) | `PascalCase` | `StatusExperimento` |
| Enum (valor/case) | `UPPER_SNAKE_CASE` | `EM_CONDUCAO` |
| Rota REST | `kebab-case` plural, PT | `modelos-avaliacao`, `grupos-coleta` |
| Arquivo TS de backend | `kebab-case.tipo.ts` | `avaliacoes.service.ts`, `auth.guard.ts` |
| Componente React (arquivo) | `PascalCase.tsx` | `CroquiGrid.tsx`, `Protected.tsx` |
| Hook React | `useCamelCase` | `useAuth`, `useExperimento` |
| Helper/lib web (arquivo) | `camelCase.ts` | `api.ts`, `auth.ts` |

### Boas práticas para nomes (do esboço, mantidas)
- **Nomes descritivos:** `resultadoAvaliacao`, não `res`.
- **Evite abreviações:** prefira `observacoes` a `obs`, `numero` a `num`, `posicao` a `pos`, `sequencia` a `seq` (salvo sigla consolidada do domínio — ex.: `CV`, `OS`, `PMG`).
- **Booleanos** começam com `is`/`has`/`can`/`should`: `isAtivo`, `hasPermissao`.
- **Coleções no plural:** `avaliacoes`, `parcelas`.
- **IDs com sufixo `Id`:** `experimentoId`, `modeloId`.
- **Datas com sufixo `At` (técnicas) ou nome de domínio claro:** `createdAt`, `updatedAt`, `deletedAt`; datas de negócio em PT por extenso (`dataSemeadura`, `dataPrevista`).

---

## 4. Banco de dados (Prisma)

### 4.1 Entidades (models)
- `PascalCase` **singular**, em PT de domínio: `Experimento`, `Parcela`, `ModeloAvaliacao`.
- A **tabela física** segue o nome do model (default do Prisma, **sem `@@map`** — D2).
- Tabelas de junção M:N: nome composto das duas pontas — `GrupoColetaItem`, `ModeloAvaliacaoPrereqAtividade`.

### 4.2 Chave primária (PK)
- **Sempre** um campo **surrogate** chamado **`id`**:
  ```prisma
  id String @id @default(cuid())
  ```
- `cuid()` é o padrão do projeto (ordenável, sem colisão, amigável a sync offline). **Não** misturar `uuid`/`autoincrement` em models novos.
- **PK composta** apenas em tabelas de relacionamento puro (sem `id` próprio):
  ```prisma
  @@id([modeloId, prerequisitoId])
  ```

### 4.3 Chave estrangeira (FK)
- Campo escalar da FK: **`<entidade>Id`** em `camelCase` → `experimentoId`, `modeloId`, `instituicaoId`.
- Campo de **relação** (objeto): nome da entidade em `camelCase` singular → `experimento`, `modelo`, `instituicao`.
- Declarar `onDelete` explicitamente quando a semântica for de composição (`onDelete: Cascade` para filhos de `Experimento`).
- Quando houver duas relações para a mesma entidade, **nomear a relation**: `@relation("ExperimentoOwner", ...)`.

```prisma
model Avaliacao {
  id            String @id @default(cuid())
  experimentoId String
  modeloId      String?
  experimento   Experimento      @relation(fields: [experimentoId], references: [id], onDelete: Cascade)
  modelo        ModeloAvaliacao? @relation(fields: [modeloId], references: [id])

  @@index([modeloId])
}
```

### 4.4 Atributos (colunas)
- `camelCase`, PT para negócio (`codigoProtocolo`, `numeroPontos`), EN para técnico (`createdAt`).
- **Sem abreviações** (§3): `observacoes` (não `obs`), `numeroAmostra` (não `numAmostra`).
- Texto longo: `@db.Text`. Opcionais: `?`. Defaults explícitos quando fizerem sentido (`@default(...)`).

### 4.5 Booleanos (D4)
- Prefixo `is`/`has`/`can`/`should`, afirmativo: `isAtivo`, `isInicio`, `hasAreaColheita`, `isCultura`, `isConfirmado`.
- ❌ Evitar: `ativo`, `eCultura`, `fornecAreaColheita`, `confirmada`, `aceito`, `personalizada`, `marco` (como booleano).

### 4.6 Timestamps e soft-delete
- **Padronizar** em três campos técnicos:
  ```prisma
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?               // soft-delete quando aplicável
  ```
- ❌ Não usar `at`, `decididoEm` ou variações. Para "quando aconteceu X", **sufixo `At`**: `aprovadoAt`, `decididoAt`, `sincronizadoAt`. (Datas de **planejamento/negócio** sem hora exata podem usar `data...`/`previsao...` em PT: `dataSemeadura`, `previsaoColheita`.)

### 4.7 Enums (D3)
- **Tipo:** `PascalCase` (`StatusExperimento`, `TipoAvaliacao`).
- **Valores:** `UPPER_SNAKE_CASE` (`EM_CONDUCAO`, `APROVADO_CAD`, `ANO_SEMESTRE`, `INTERNO`).
- **Use códigos legíveis, nunca inteiros mágicos.** Prefira `EM_CONDUCAO` a `3`. Se um valor numérico for inevitável (ex.: sistema legado), ele **precisa** da referência da §4.9.
- Mapas de label (enum → rótulo PT) têm a **key** no valor do enum (`EM_CONDUCAO:`) e o **valor** em PT (`"Em condução"`). Evoluir para o banco (§4.9).

### 4.8 Índices
- `@@index([fk])` em **toda FK** usada em busca/escopo (multi-tenancy: `instituicaoId`, `departamentoId`).
- `@@unique([...])` para chaves naturais/idempotência (`@@unique([avaliacaoId, parcelaId, numeroAmostra])`).

### 4.9 Referência de enumerados no banco (D6)

**Regra:** nenhum valor enumerado pode existir no sistema sem uma **referência legível no banco** que diga o que ele significa — mesmo que seja apenas uma tabela auxiliar de cadastro. Se um status é `1/2/3` (ou um código como `EM_CONDUCAO`), tem de haver um lugar no banco onde o usuário/admin capture o significado de cada valor.

**Por quê:** o significado dos códigos passa a ser **dado** (consultável, exportável, traduzível, auditável), não conhecimento preso no código. Rótulos deixam de ser hardcoded em mapas de UI.

**Padrão recomendado (não-destrutivo): tabela de domínio.** Os enums seguem existindo como **tipo** (Prisma enum / `enum` no banco) para integridade e type-safety; em paralelo, uma tabela de dicionário documenta cada valor:

```prisma
/// Dicionário de valores enumerados (cadastro auxiliar). Uma linha por (dominio, codigo).
model DominioValor {
  id        String  @id @default(cuid())
  dominio   String  // ex.: "StatusExperimento"
  codigo    String  // ex.: "EM_CONDUCAO"
  rotulo    String  // ex.: "Em condução"  (PT — D1)
  descricao String? @db.Text
  ordem     Int     @default(0)
  isAtivo   Boolean @default(true)

  @@unique([dominio, codigo])
  @@index([dominio])
}
```

- **Seedada** com todos os valores de todos os enums + rótulo/descrição em PT. O seed é a fonte; um teste garante que todo valor de enum tem linha correspondente (sem órfãos nos dois sentidos).
- A **API expõe** os rótulos (ex.: `GET /dominios/:dominio`) e a **UI consome do banco**, substituindo os mapas hardcoded.
- Quando o domínio de valores é mutável pelo usuário (cadastro de verdade, não constante de negócio), prefira **tabela-lookup com FK** (`statusId → Status`) em vez de `enum`. `enum` fica para conjuntos fechados e estáveis (regra de negócio).

> Em projetos novos, criar a tabela de domínio **junto** com os primeiros enums. Em legado, é um passo de adoção incremental (§12).

---

## 5. Backend (NestJS)

### 5.1 Camadas
```
Controller  (fino: roteia, valida entrada, serializa saída)
   └─ Service  (@Injectable: orquestra, transações, acesso a Prisma)
        └─ packages/domain  (regra pura, sem I/O, testável isolado)
```
- Controller **não** contém regra de negócio nem query Prisma direta.
- Service **não** redefine regra que pertence ao domínio — **importa** de `packages/domain`.

### 5.2 Validação de entrada (substitui FormRequest)
- Toda entrada (`@Body()`, `@Query()`, `@Param()`) validada por **schema Zod** via pipe, **antes** do service.
- O schema/tipo de entrada é o **DTO**. Reaproveitar os schemas Zod que já existem em `packages/domain` quando aplicável.
- ❌ Estado atual: `@Body()` chega **sem tipo/validação** em vários controllers — gap a fechar (§12).

```ts
// avaliacoes.schema.ts
export const criarLancamentoSchema = z.object({
  parcelaId: z.string().cuid(),
  valorColetado: z.number().nullable(),
});
export type CriarLancamentoDto = z.infer<typeof criarLancamentoSchema>;

// controller
@Post(":id/lancamentos")
criar(@Param("id") id: string, @Body(new ZodPipe(criarLancamentoSchema)) dto: CriarLancamentoDto) {
  return this.avaliacoesService.lancar(id, dto);
}
```

### 5.3 Transações
- Operações que escrevem em múltiplas tabelas → `prisma.$transaction([...])` ou callback transacional. Ex.: aplicar grupo de coleta (cria avaliações + pré-requisitos).

### 5.4 Erros e respostas
- Usar as exceções do Nest com **mensagem em PT**: `throw new ForbiddenException("Você não tem acesso a este experimento")`.
- Status HTTP semânticos: `404` (`NotFoundException`), `400` (`BadRequestException`), `403` (`ForbiddenException`), `409` (`ConflictException`).
- **Não** retornar entidade Prisma com campo sensível (`senhaHash`) — selecionar/serializar.

### 5.5 Injeção de dependência
- Tudo que tem dependência é `@Injectable` e recebido por construtor. `new` reservado a exceções, libs e value objects.

---

## 6. API REST

- Recursos no **plural, kebab-case, PT**: `/experimentos`, `/modelos-avaliacao`, `/grupos-coleta`.
- Sub-recursos aninhados: `/experimentos/:id/avaliacoes`, `/experimentos/:id/atividades`.
- Verbos HTTP padrão: `GET` (ler), `POST` (criar/ação), `PUT`/`PATCH` (atualizar), `DELETE` (remover).
- Ação não-CRUD como sub-rota explícita: `POST /experimentos/:id/coleta-lote`, `POST /experimentos/:id/avaliacoes/do-modelo`.

---

## 7. Frontend (Next.js / React)

- **Componentes:** arquivo e nome em `PascalCase.tsx` (`CroquiGrid.tsx`). Um componente por arquivo quando significativo.
- **Hooks:** `useCamelCase` (`useAuth`).
- **Libs/utilitários:** `camelCase.ts` (`api.ts`).
- **Rotas (App Router):** pastas em PT/kebab seguindo a URL (`app/catalogo/page.tsx`), nomes técnicos do Next (`page.tsx`, `layout.tsx`) intocados.
- **Strings de UI sempre em PT** (D1). Nada de texto em inglês visível ao usuário.
- Estado e props em `camelCase`; tipos compartilhados vêm de `packages/domain` quando possível (não redefinir).

---

## 8. Domínio (`packages/domain`) e Analytics

- Funções **puras**, sem I/O, em `camelCase` (`gerarCroqui`, `areaUtilDoExperimento`, `dedupLancamentos`).
- Tipos e schemas **Zod** colocalizados; são a fonte de verdade dos contratos.
- **Todo** comportamento de domínio tem teste (`*.test.ts`, Vitest). Hoje: domain **59** + analytics **24**.
- `packages/analytics`: estatística pura, validada por **golden tests** contra o SAGRE.

---

## 9. Ferramental (substitui Pint/PSR-12)

> **Gap atual:** o monorepo **não tem ESLint/Prettier** compartilhado (só `next lint` no web). Adotar como parte da §12.

- **Prettier** na raiz (formatação única): largura, aspas, vírgula final, ponto-e-vírgula padronizados.
- **ESLint** com `@typescript-eslint` em `api`, `web`, `domain`, `analytics`, incluindo regra de **naming-convention** que codifica esta seção (camelCase/PascalCase/UPPER_SNAKE, prefixo de booleano).
- Scripts: `pnpm lint` (turbo) e `pnpm format` em todos os pacotes.
- Idealmente, **pre-commit** (lint-staged) e o **CI** ([../../.github/workflows/ci.yml](../../.github/workflows/ci.yml)) rodando `lint` no job `unit`.

---

## 10. Commits e branches

- **Branches:** `feature/...`, `ci/...`, `fix/...`, `docs/...` (kebab-case).
- **Commits:** prefixo de tipo + escopo curto, em PT: `feat:`, `fix:`, `docs:`, `ci:`, `refactor:`, `test:`, `chore:`. Mensagem no imperativo.
  - Ex.: `refactor(schema): booleanos com prefixo is/has (D4)`.
- Trabalho por etapa: commit → push → (release quando marco). Ver STATUS §10.

---

## 11. Checklist de revisão (PR)

- [ ] Regra de negócio no **domínio/service**, não no controller/tela.
- [ ] Entrada **validada por Zod**; saída sem campo sensível.
- [ ] Nomes seguem §3/§4 (idioma, casing, sem abreviação, booleano com prefixo).
- [ ] FK com `@@index`; chave natural com `@@unique`; `onDelete` explícito.
- [ ] Strings de UI/erros em **PT**.
- [ ] Testes de domínio para a regra nova; `pnpm typecheck` e `pnpm test` verdes.
- [ ] `pnpm lint`/`format` aplicados.

---

## 12. Estado atual × padrão (gap analysis) e plano de adoção (D5)

**Já em conformidade:** FK `<entidade>Id` + relação camelCase; PK `id cuid()`; rotas kebab-case plural; DI (sem `new` indevido); models PascalCase; domínio puro testado.

**Progresso por tema (1 PR por tema, verificado com typecheck + testes + e2e). Iniciativa concluída em 29/06/2026.**

| # | Tema | Alvo | Custo | Status |
|---|---|---|---|---|
| — | Ferramental | ESLint/Prettier + naming-convention | só config | ✅ feito (PR #4) |
| — | Documento | este padrão (+D6) | doc | ✅ feito (PR #3, #7) |
| 1 | Booleanos (D4) | prefixo `is/has/can` | migração (RENAME COLUMN) | ✅ feito (PR #5) |
| 2 | Enums (D3) | `UPPER_SNAKE_CASE` | migração de dados | ✅ feito (PR #6) |
| 3 | Timestamps | `at`/`decididoEm` → sufixo `At` | migração de coluna | ✅ feito (PR #8) |
| 4 | Abreviações | `obs`/`num*`/`pos*`/`seq`/`refTipo` → por extenso | migração de coluna | ✅ feito (PR #9) |
| 5 | Idioma | model `User` → `Usuario` | migração + refs | ✅ feito (PR #10) |
| 6 | Referência de enums (D6) | tabela `DominioValor` + seed + API | código + tabela nova | ✅ feito (PR #11) |
| — | Validação Zod | `@Body()` → schema Zod + pipe (48 endpoints) | só código | ✅ feito (PR #12, #13) |

**Tudo em conformidade:** idioma, casing, PK/FK, **booleanos**, **enums**, **timestamps**, **sem abreviações**, `Usuario`, **referência de enums no banco** e **validação Zod na borda**. Já eram conformes desde o início: FK `<entidade>Id` + relação camelCase; PK `id cuid()`; rotas kebab-case plural; DI; models PascalCase; domínio puro testado.

**Follow-ups abertos (opcionais, sem migração):**
- UI consumir os rótulos de `DominioValor` (substituir mapas de label hardcoded no web — §4.9). Os rótulos já são idênticos (mesma fonte PT).
- `userId`/`UsuarioAtual.userId` mantidos como convenção de auth (exceção documentada no tema 5); renomear p/ `usuarioId` só se desejado.

**Como cada tema de migração é feito (receita validada nos temas 1–2):**
1. Schema + domínio (uniões espelho) → `prisma generate` → **typecheck como guia** dos literais a trocar.
2. Literais frouxos (string solta, mapas de label, `<option value>`, e2e) tratados por varredura controlada — **palavras ambíguas preservadas** (ex.: `"data"` rótulo vs `DATA` tipo; `"todos"` filtro vs enum; `StatusMarco`).
3. Migração **preservando dados** (RENAME COLUMN p/ rename; ENUM→VARCHAR→UPDATE→ENUM p/ valores). Verificar `migrate diff` (sem drift).
4. Atualizar `seed.ts`, web, mobile, **e2e**; rodar typecheck + domain + analytics + 5 e2e — tudo verde antes do PR.

> **Receita comprovada** nesta iniciativa: um tema por PR, sobre uma `main` estável (pilha rasa), cada um com migração preservando dados e verificação completa (typecheck + domain + analytics + build + reseed + 5 e2e) antes do merge. Reutilizável em outros projetos ao adotar este padrão sobre um código legado.

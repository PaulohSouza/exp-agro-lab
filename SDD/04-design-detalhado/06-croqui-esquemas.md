# 06 — Croqui de 2+ fatores: esquema fatorial × parcela subdividida

> Quando o experimento tem **≥2 fatores**, o croqui precisa saber o **esquema** de
> arranjo. O esquema muda a casualização, a interação de arraste, as regras de
> validação e — importante — o **modelo de erro da ANOVA**. Fonte da verdade:
> `packages/domain` (`croqui.ts`). @see RN-CROQUI-SPLIT

## 1. Os dois esquemas

| | **Fatorial** | **Parcela subdividida (split-plot)** |
|---|---|---|
| Tratamento | cada combinação dos níveis | combinação, mas hierarquizada (principal × sub) |
| Casualização | **livre** dentro do bloco | **restrita**: fator principal entre parcelas principais; subfator dentro de cada principal |
| Unidade física | 1 parcela por combinação | parcela **principal** (fator A) subdividida em **subparcelas** (fator B) |
| Erro experimental | **um** | **dois** — erro(a) p/ A, erro(b) p/ B e A×B |
| Restrição no croqui | só a do delineamento | subparcelas de uma principal **contíguas e retangulares**; não podem ser separadas |

A restrição física do split-plot é o cerne: **não se pode separar uma parcela
principal** — suas subparcelas andam juntas.

## 2. Modelo de dados

- **Experimento**: `esquema: 'fatorial' | 'parcela_subdividida'` (só relevante com
  ≥2 fatores) + `fatorPrincipalOrdem` (qual fator vai na parcela principal;
  default = fator de ordem 1, selecionável na UI).
- **Parcela**: `grupoPrincipal` (id da parcela principal), `nivelPrincipal`,
  `nivelSub`. Integridade ⇒ toda parcela com o mesmo `grupoPrincipal` compartilha
  o `nivelPrincipal` e ocupa um retângulo contíguo. Campos **ausentes** no
  fatorial (retrocompatível).

## 3. Domínio (`packages/domain/croqui.ts`) — fonte da verdade

Layout do split-plot: blocos empilhados em **faixas de linhas**; cada parcela
principal é **uma linha** de `b` subparcelas (colunas).

- `gerarParcelaSubdividida(tratamentos: TratamentoFatorial[], blocos, opts)` —
  casualiza as principais (níveis de A) dentro do bloco e as subparcelas (níveis
  de B) dentro de cada principal. Determinístico por `seed`. Exige todas as
  combinações A×B.
- `validarParcelaSubdividida(croqui): { ok, erros[] }` — garante: (1) cada
  principal tem um só nível de A; (2) níveis de B únicos por principal; (3)
  subparcelas **contíguas/retangulares** (impede a separação); (4) DBC do fator
  principal (cada nível de A 1× por bloco). Retorna mensagens para o **422** da API.
- `trocarSubparcela(croqui, numA, numB)` — reordena o subfator; **só na mesma
  parcela principal** (senão lança erro "separaria a parcela").
- `trocarParcelaPrincipal(croqui, grupoA, grupoB)` — move o whole-plot inteiro;
  **só no mesmo bloco** (preserva o DBC do fator principal).

Testes: `croqui.test.ts` (geração, determinismo, integridade, e as duas
operações de arraste com seus bloqueios).

## 4. UX de arraste — como impedir separar a parcela

- Borda **grossa** em volta de cada parcela principal; subparcelas com borda fina
  interna (agrupamento visível).
- Pegar pela **borda da principal** → move o grupo todo; drop válido só sobre
  outra principal **do mesmo bloco** → chama `trocarParcelaPrincipal`.
- Pegar por uma **subparcela** → realça só as posições válidas (subparcelas do
  **mesmo grupo**); drop fora = rejeitado (snap-back) + aviso. → `trocarSubparcela`.
- Defesa em profundidade: a UI previne; a API revalida com
  `validarParcelaSubdividida` antes de salvar (rejeita 422). O domínio **nunca**
  aceita um estado com grupo disjunto.

## 5. Liga com a Analytics

Split-plot tem **dois erros experimentais** → a ANOVA ramifica por `esquema`.
Isto reforça a dependência da analytics fatorial/split-plot (ver
[02-design-modulos.md](02-design-modulos.md), fases B/C). A aba Análise deve usar
`esquema` para escolher o modelo.

## 6. Futuro

**Faixas / strip-plot** (faixas subdivididas): mesma mecânica de restrição, com
mais um eixo de casualização. Fora do escopo atual.

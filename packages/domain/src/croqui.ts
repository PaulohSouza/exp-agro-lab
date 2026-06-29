import { mulberry32, shuffle } from "./rng.js";
import type {
  Croqui,
  Delineamento,
  Parcela,
  ResultadoValidacao,
  TratamentoFatorial,
  TratamentoRef,
} from "./types.js";

export interface GerarCroquiOpts {
  /** Seed para casualização reproduzível. Mesmo seed => mesmo croqui. */
  seed?: number;
  /** Número da primeira parcela (default 1). */
  numeroInicial?: number;
}

/**
 * Gera o croqui a partir do delineamento e dos tratamentos.
 *
 * Layout: cada **bloco/repetição** é uma coluna; cada linha é um "slot" de
 * tratamento. Numeração column-major (desce a coluna), espelhando o SISTEMA-base.
 * - DBC: casualização **dentro de cada bloco** (cada bloco contém todos os
 *   tratamentos exatamente uma vez).
 * - DIC/FATORIAL: casualização **global** sobre o conjunto tratamentos×blocos.
 *
 * @see RN-CROQUI
 */
export function gerarCroqui(
  delineamento: Delineamento,
  tratamentos: readonly TratamentoRef[],
  blocos: number,
  opts: GerarCroquiOpts = {},
): Croqui {
  if (tratamentos.length === 0) throw new Error("É necessário ao menos um tratamento.");
  if (blocos < 1) throw new Error("É necessário ao menos um bloco/repetição.");

  const seed = opts.seed ?? 1;
  const rand = mulberry32(seed);
  const numLinhas = tratamentos.length;
  const numColunas = blocos;

  // Define, por coluna (bloco), a ordem dos tratamentos em cada linha.
  const colunas: TratamentoRef[][] = [];
  if (delineamento === "DBC") {
    for (let b = 0; b < blocos; b++) colunas.push(shuffle(tratamentos, rand));
  } else {
    // DIC / FATORIAL: pool global tratamentos×blocos, embaralhado e fatiado.
    const pool: TratamentoRef[] = [];
    for (let b = 0; b < blocos; b++) pool.push(...tratamentos);
    const embaralhado = shuffle(pool, rand);
    for (let b = 0; b < blocos; b++) {
      colunas.push(embaralhado.slice(b * numLinhas, (b + 1) * numLinhas));
    }
  }

  const parcelas: Parcela[] = [];
  let numero = opts.numeroInicial ?? 1;
  for (let c = 0; c < numColunas; c++) {
    for (let l = 0; l < numLinhas; l++) {
      const t = colunas[c][l];
      parcelas.push({
        numero: numero++,
        bloco: c + 1,
        tratamentoId: t.id,
        tratamentoNumeroRef: t.numeroRef,
        posicaoLinha: l,
        posicaoColuna: c,
        // ponto de início no canto inferior-esquerdo (como no SISTEMA-base).
        isInicio: c === 0 && l === numLinhas - 1,
      });
    }
  }

  return { parcelas, numLinhas, numColunas, delineamento };
}

/** Valida que, num DBC, cada bloco contém cada tratamento exatamente uma vez. */
export function validarDBC(croqui: Croqui): boolean {
  const porBloco = new Map<number, Map<string, number>>();
  for (const p of croqui.parcelas) {
    const m = porBloco.get(p.bloco) ?? new Map<string, number>();
    m.set(p.tratamentoId, (m.get(p.tratamentoId) ?? 0) + 1);
    porBloco.set(p.bloco, m);
  }
  for (const m of porBloco.values()) {
    for (const count of m.values()) if (count !== 1) return false;
  }
  return true;
}

// ───────────────────────────── Parcela subdividida (split-plot) ──────────────
//
// Layout: os blocos são empilhados em **faixas de linhas**. Cada **parcela
// principal** (fator principal) é uma linha de `b` **subparcelas** (colunas, o
// subfator). Casualização restrita: dentro do bloco sorteiam-se as parcelas
// principais (níveis do fator principal); dentro de cada principal sorteiam-se
// as subparcelas (níveis do subfator). Isto produz **dois erros experimentais**
// — por isso a ANOVA difere do fatorial. @see RN-CROQUI-SPLIT

/**
 * Gera o croqui de uma **parcela subdividida** (split-plot em blocos / DBC).
 *
 * @param tratamentos combinações fator principal × subfator (todas, sem repetir)
 * @param blocos número de repetições
 */
export function gerarParcelaSubdividida(
  tratamentos: readonly TratamentoFatorial[],
  blocos: number,
  opts: GerarCroquiOpts = {},
): Croqui {
  if (tratamentos.length === 0) throw new Error("É necessário ao menos um tratamento.");
  if (blocos < 1) throw new Error("É necessário ao menos um bloco/repetição.");

  const niveisA = [...new Set(tratamentos.map((t) => t.nivelPrincipal))].sort((x, y) => x - y);
  const niveisB = [...new Set(tratamentos.map((t) => t.nivelSub))].sort((x, y) => x - y);
  const a = niveisA.length;
  const b = niveisB.length;
  if (tratamentos.length !== a * b) {
    throw new Error(
      "Parcela subdividida exige todas as combinações fator principal × subfator (sem faltas/repetições).",
    );
  }
  const porCombo = new Map<string, TratamentoFatorial>();
  for (const t of tratamentos) porCombo.set(`${t.nivelPrincipal}:${t.nivelSub}`, t);
  for (const i of niveisA) {
    for (const j of niveisB) {
      if (!porCombo.has(`${i}:${j}`)) throw new Error(`Combinação ausente (A${i}, B${j}).`);
    }
  }

  const rand = mulberry32(opts.seed ?? 1);
  const parcelas: Parcela[] = [];
  let numero = opts.numeroInicial ?? 1;

  for (let bloco = 0; bloco < blocos; bloco++) {
    const ordemA = shuffle(niveisA, rand); // casualização das parcelas principais
    for (let wp = 0; wp < a; wp++) {
      const nivelA = ordemA[wp];
      const posicaoLinha = bloco * a + wp;
      const grupoPrincipal = posicaoLinha; // id único da parcela principal no croqui
      const ordemB = shuffle(niveisB, rand); // casualização das subparcelas
      for (let sp = 0; sp < b; sp++) {
        const nivelB = ordemB[sp];
        const t = porCombo.get(`${nivelA}:${nivelB}`)!;
        parcelas.push({
          numero: numero++,
          bloco: bloco + 1,
          tratamentoId: t.id,
          tratamentoNumeroRef: t.numeroRef,
          posicaoLinha,
          posicaoColuna: sp,
          isInicio: bloco === 0 && wp === a - 1 && sp === 0,
          grupoPrincipal,
          nivelPrincipal: nivelA,
          nivelSub: nivelB,
        });
      }
    }
  }

  return {
    parcelas,
    numLinhas: blocos * a,
    numColunas: b,
    delineamento: "DBC",
    esquema: "parcela_subdividida",
  };
}

/** As subparcelas ocupam um retângulo cheio (sem buracos nem espalhamento)? */
function ehRetanguloContiguo(sub: readonly Parcela[]): boolean {
  const linhas = sub.map((p) => p.posicaoLinha);
  const cols = sub.map((p) => p.posicaoColuna);
  const area =
    (Math.max(...linhas) - Math.min(...linhas) + 1) * (Math.max(...cols) - Math.min(...cols) + 1);
  if (area !== sub.length) return false;
  return new Set(sub.map((p) => `${p.posicaoLinha}:${p.posicaoColuna}`)).size === sub.length;
}

/**
 * Valida a integridade de uma parcela subdividida. Garante, sobretudo, que
 * **nenhuma parcela principal foi separada** (subparcelas contíguas, mesmo nível
 * do fator principal) e que o fator principal respeita o DBC.
 */
export function validarParcelaSubdividida(croqui: Croqui): ResultadoValidacao {
  const erros: string[] = [];
  const grupos = new Map<number, Parcela[]>();
  for (const p of croqui.parcelas) {
    if (
      p.grupoPrincipal === undefined ||
      p.nivelPrincipal === undefined ||
      p.nivelSub === undefined
    ) {
      erros.push(`Parcela ${p.numero}: faltam metadados de split-plot (grupoPrincipal/nível).`);
      continue;
    }
    const arr = grupos.get(p.grupoPrincipal) ?? [];
    arr.push(p);
    grupos.set(p.grupoPrincipal, arr);
  }
  if (erros.length) return { ok: false, erros };

  for (const [gid, sub] of grupos) {
    if (new Set(sub.map((p) => p.nivelPrincipal)).size !== 1) {
      erros.push(
        `Parcela principal ${gid}: níveis do fator principal divergentes — a parcela foi separada.`,
      );
    }
    const niveisB = sub.map((p) => p.nivelSub);
    if (new Set(niveisB).size !== niveisB.length) {
      erros.push(`Parcela principal ${gid}: nível do subfator repetido.`);
    }
    if (!ehRetanguloContiguo(sub)) {
      erros.push(
        `Parcela principal ${gid}: subparcelas não são contíguas — não é permitido separar a parcela.`,
      );
    }
  }

  // DBC do fator principal: por bloco, cada nível do fator principal em 1 só parcela principal.
  const porBloco = new Map<number, Map<number, Set<number>>>();
  for (const p of croqui.parcelas) {
    const m = porBloco.get(p.bloco) ?? new Map<number, Set<number>>();
    const s = m.get(p.nivelPrincipal!) ?? new Set<number>();
    s.add(p.grupoPrincipal!);
    m.set(p.nivelPrincipal!, s);
    porBloco.set(p.bloco, m);
  }
  for (const [bloco, m] of porBloco) {
    for (const [nivelA, gruposDoNivel] of m) {
      if (gruposDoNivel.size !== 1) {
        erros.push(
          `Bloco ${bloco}: nível ${nivelA} do fator principal em ${gruposDoNivel.size} parcelas principais (esperado 1).`,
        );
      }
    }
  }

  return { ok: erros.length === 0, erros };
}

/**
 * Troca duas **subparcelas** (reordena o subfator). Só é permitido **dentro da
 * mesma parcela principal** — cruzar a fronteira separaria a parcela. As
 * posições/numeração são preservadas; troca-se o conteúdo (tratamento + nível B).
 */
export function trocarSubparcela(croqui: Croqui, numeroA: number, numeroB: number): Croqui {
  const a = croqui.parcelas.find((p) => p.numero === numeroA);
  const b = croqui.parcelas.find((p) => p.numero === numeroB);
  if (!a || !b) throw new Error("Subparcela não encontrada.");
  if (a.grupoPrincipal === undefined || a.grupoPrincipal !== b.grupoPrincipal) {
    throw new Error(
      "Subparcelas de parcelas principais diferentes não podem ser trocadas — isso separaria a parcela.",
    );
  }
  const parcelas = croqui.parcelas.map((p) => {
    if (p.numero === numeroA)
      return {
        ...p,
        tratamentoId: b.tratamentoId,
        tratamentoNumeroRef: b.tratamentoNumeroRef,
        nivelSub: b.nivelSub,
      };
    if (p.numero === numeroB)
      return {
        ...p,
        tratamentoId: a.tratamentoId,
        tratamentoNumeroRef: a.tratamentoNumeroRef,
        nivelSub: a.nivelSub,
      };
    return p;
  });
  return { ...croqui, parcelas };
}

/**
 * Troca duas **parcelas principais inteiras** (move o whole-plot como uma
 * unidade). Só dentro do **mesmo bloco**, para manter o DBC do fator principal.
 * O conteúdo é trocado preservando as posições físicas; as subparcelas são
 * pareadas por coluna.
 */
export function trocarParcelaPrincipal(croqui: Croqui, grupoA: number, grupoB: number): Croqui {
  const subA = croqui.parcelas.filter((p) => p.grupoPrincipal === grupoA);
  const subB = croqui.parcelas.filter((p) => p.grupoPrincipal === grupoB);
  if (!subA.length || !subB.length) throw new Error("Parcela principal não encontrada.");
  if (subA[0].bloco !== subB[0].bloco) {
    throw new Error(
      "Parcelas principais de blocos diferentes não podem ser trocadas (mantém o DBC do fator principal).",
    );
  }
  if (subA.length !== subB.length)
    throw new Error("Parcelas principais com número de subparcelas diferente.");

  const aByCol = new Map(subA.map((p) => [p.posicaoColuna, p]));
  const bByCol = new Map(subB.map((p) => [p.posicaoColuna, p]));
  const mover = (origem: Map<number, Parcela>, p: Parcela): Parcela => {
    const c = origem.get(p.posicaoColuna);
    if (!c) throw new Error("Subparcelas das parcelas principais não alinham por coluna.");
    return {
      ...p,
      tratamentoId: c.tratamentoId,
      tratamentoNumeroRef: c.tratamentoNumeroRef,
      nivelPrincipal: c.nivelPrincipal,
      nivelSub: c.nivelSub,
    };
  };
  const parcelas = croqui.parcelas.map((p) => {
    if (p.grupoPrincipal === grupoA) return mover(bByCol, p);
    if (p.grupoPrincipal === grupoB) return mover(aByCol, p);
    return p;
  });
  return { ...croqui, parcelas };
}

import { mulberry32, shuffle } from "./rng.js";
import type { Croqui, Delineamento, Parcela, TratamentoRef } from "./types.js";

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
 * tratamento. Numeração column-major (desce a coluna), espelhando o sistema-base.
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
        posLinha: l,
        posColuna: c,
        // ponto de início no canto inferior-esquerdo (como no sistema-base).
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

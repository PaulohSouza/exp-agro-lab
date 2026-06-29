import { describe, it, expect } from "vitest";
import {
  gerarCroqui,
  validarDBC,
  gerarParcelaSubdividida,
  validarParcelaSubdividida,
  trocarSubparcela,
  trocarParcelaPrincipal,
} from "./croqui.js";
import type { TratamentoFatorial, TratamentoRef } from "./types.js";

const trats: TratamentoRef[] = [1, 2, 3, 4, 5].map((n) => ({ id: `T${n}`, numeroRef: n }));

// Split-plot 2×3: fator principal (A) com 2 níveis × subfator (B) com 3 níveis.
function tratsSplit(): TratamentoFatorial[] {
  const out: TratamentoFatorial[] = [];
  let n = 1;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++)
      out.push({ id: `T${n}`, numeroRef: n++, nivelPrincipal: i, nivelSub: j });
  }
  return out;
}

describe("gerarCroqui (cenário PC1699: DBC 5 tratamentos × 4 blocos)", () => {
  it("gera 20 parcelas (5×4)", () => {
    const c = gerarCroqui("DBC", trats, 4, { seed: 42, numeroInicial: 43958 });
    expect(c.parcelas).toHaveLength(20);
    expect(c.numLinhas).toBe(5);
    expect(c.numColunas).toBe(4);
  });

  it("DBC: cada bloco contém cada tratamento exatamente uma vez", () => {
    const c = gerarCroqui("DBC", trats, 4, { seed: 42 });
    expect(validarDBC(c)).toBe(true);
  });

  it("é determinístico (mesmo seed => mesmo layout)", () => {
    const a = gerarCroqui("DBC", trats, 4, { seed: 7 });
    const b = gerarCroqui("DBC", trats, 4, { seed: 7 });
    expect(a.parcelas).toEqual(b.parcelas);
  });

  it("seeds diferentes produzem casualizações diferentes", () => {
    const a = gerarCroqui("DBC", trats, 4, { seed: 1 });
    const b = gerarCroqui("DBC", trats, 4, { seed: 2 });
    expect(a.parcelas).not.toEqual(b.parcelas);
  });

  it("numera a partir do número inicial e marca o ponto de início", () => {
    const c = gerarCroqui("DBC", trats, 4, { seed: 42, numeroInicial: 43958 });
    expect(c.parcelas[0].numero).toBe(43958);
    expect(c.parcelas.filter((p) => p.isInicio)).toHaveLength(1);
  });

  it("DIC: usa cada tratamento o número de blocos de vezes (casualização global)", () => {
    const c = gerarCroqui("DIC", trats, 4, { seed: 3 });
    expect(c.parcelas).toHaveLength(20);
    for (const t of trats) {
      const n = c.parcelas.filter((p) => p.tratamentoId === t.id).length;
      expect(n).toBe(4);
    }
  });
});

describe("gerarParcelaSubdividida (split-plot 2×3 em 4 blocos)", () => {
  it("gera r×a×b parcelas (4×2×3 = 24), grade (4·2) linhas × 3 colunas", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 42 });
    expect(c.parcelas).toHaveLength(24);
    expect(c.numLinhas).toBe(8);
    expect(c.numColunas).toBe(3);
    expect(c.esquema).toBe("parcela_subdividida");
    expect(c.delineamento).toBe("DBC");
  });

  it("é determinístico e respeita seed", () => {
    expect(gerarParcelaSubdividida(tratsSplit(), 4, { seed: 7 }).parcelas).toEqual(
      gerarParcelaSubdividida(tratsSplit(), 4, { seed: 7 }).parcelas,
    );
    expect(gerarParcelaSubdividida(tratsSplit(), 4, { seed: 1 }).parcelas).not.toEqual(
      gerarParcelaSubdividida(tratsSplit(), 4, { seed: 2 }).parcelas,
    );
  });

  it("o croqui gerado passa em validarParcelaSubdividida", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 5 });
    expect(validarParcelaSubdividida(c)).toEqual({ ok: true, erros: [] });
  });

  it("cada parcela principal tem 1 nível do fator principal e todos os do subfator", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 9 });
    const grupos = new Map<number, typeof c.parcelas>();
    for (const p of c.parcelas)
      grupos.set(p.grupoPrincipal!, [...(grupos.get(p.grupoPrincipal!) ?? []), p]);
    expect(grupos.size).toBe(8); // 4 blocos × 2 níveis de A
    for (const sub of grupos.values()) {
      expect(new Set(sub.map((p) => p.nivelPrincipal)).size).toBe(1);
      expect(new Set(sub.map((p) => p.nivelSub))).toEqual(new Set([0, 1, 2]));
    }
  });

  it("cada bloco contém cada nível do fator principal exatamente uma vez", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 3 });
    for (let bloco = 1; bloco <= 4; bloco++) {
      const gruposNoBloco = new Set(
        c.parcelas.filter((p) => p.bloco === bloco).map((p) => p.grupoPrincipal),
      );
      expect(gruposNoBloco.size).toBe(2);
    }
  });

  it("exige todas as combinações (rejeita fatorial incompleto)", () => {
    const incompleto = tratsSplit().slice(0, 5);
    expect(() => gerarParcelaSubdividida(incompleto, 4)).toThrow(/todas as combinações/);
  });
});

describe("operações de arraste split-plot (impedem separar a parcela)", () => {
  it("trocarSubparcela dentro da mesma parcela principal mantém a integridade", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 11 });
    const g0 = c.parcelas.filter((p) => p.grupoPrincipal === 0);
    const novo = trocarSubparcela(c, g0[0].numero, g0[1].numero);
    expect(validarParcelaSubdividida(novo).ok).toBe(true);
    // o conteúdo (nível B) foi trocado entre as duas posições
    const a = novo.parcelas.find((p) => p.numero === g0[0].numero)!;
    expect(a.nivelSub).toBe(g0[1].nivelSub);
  });

  it("trocarSubparcela entre parcelas principais distintas é bloqueado", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 11 });
    const g0 = c.parcelas.find((p) => p.grupoPrincipal === 0)!;
    const g1 = c.parcelas.find((p) => p.grupoPrincipal === 1)!;
    expect(() => trocarSubparcela(c, g0.numero, g1.numero)).toThrow(/separaria a parcela/);
  });

  it("trocarParcelaPrincipal no mesmo bloco mantém o DBC", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 13 });
    // grupos 0 e 1 estão no bloco 1
    const novo = trocarParcelaPrincipal(c, 0, 1);
    expect(validarParcelaSubdividida(novo).ok).toBe(true);
  });

  it("trocarParcelaPrincipal entre blocos diferentes é bloqueado", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 13 });
    // grupo 0 (bloco 1) × grupo 2 (bloco 2)
    expect(() => trocarParcelaPrincipal(c, 0, 2)).toThrow(/blocos diferentes/);
  });

  it("validarParcelaSubdividida detecta uma parcela separada manualmente", () => {
    const c = gerarParcelaSubdividida(tratsSplit(), 4, { seed: 17 });
    // força um nível de A divergente dentro de uma parcela principal
    const corrompido = {
      ...c,
      parcelas: c.parcelas.map((p) =>
        p.grupoPrincipal === 0 && p.posicaoColuna === 0 ? { ...p, nivelPrincipal: 99 } : p,
      ),
    };
    const r = validarParcelaSubdividida(corrompido);
    expect(r.ok).toBe(false);
    expect(r.erros.join(" ")).toMatch(/separada|principal/);
  });
});

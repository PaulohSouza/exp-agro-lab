import { describe, it, expect } from "vitest";
import { gerarCroqui, validarDBC } from "./croqui.js";
import type { TratamentoRef } from "./types.js";

const trats: TratamentoRef[] = [1, 2, 3, 4, 5].map((n) => ({ id: `T${n}`, numeroRef: n }));

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

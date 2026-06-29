import { describe, it, expect } from "vitest";
import { ptukey, qtukey } from "./tukey.js";

// Valores críticos q(0,95; k, df) e q(0,99; k, df) das tabelas de Tukey
// (idênticos ao qtukey do R, referência do SAGRE). Tolerância ~0,01.
describe("qtukey — amplitude estudentizada (vs tabela de Tukey)", () => {
  const casos: Array<[number, number, number, number]> = [
    // [p, k, df, qEsperado]
    [0.95, 2, 10, 3.151],
    [0.95, 3, 10, 3.877],
    [0.95, 4, 12, 4.199],
    [0.95, 5, 20, 4.232],
    [0.95, 3, 30, 3.486],
    [0.95, 2, 100000, 2.772], // df→∞: 1,95996·√2
    [0.99, 3, 10, 5.27],
    [0.99, 4, 15, 5.246],
  ];
  for (const [p, k, df, esperado] of casos) {
    it(`q(${p}; k=${k}, df=${df}) ≈ ${esperado}`, () => {
      expect(qtukey(p, k, df)).toBeCloseTo(esperado, 1);
    });
  }
});

describe("ptukey — monotonicidade e bordas", () => {
  it("é crescente em q", () => {
    expect(ptukey(2, 4, 20)).toBeLessThan(ptukey(4, 4, 20));
  });
  it("ptukey(qtukey(p)) ≈ p", () => {
    const q = qtukey(0.95, 5, 18);
    expect(ptukey(q, 5, 18)).toBeCloseTo(0.95, 2);
  });
});

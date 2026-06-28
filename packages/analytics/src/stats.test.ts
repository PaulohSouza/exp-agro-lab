import { describe, it, expect } from "vitest";
import { fSf, tInv, chiSqSf, tCdf } from "./stats.js";

describe("distribuições (vs valores de tabela)", () => {
  it("t inversa bate com a tabela", () => {
    expect(tInv(0.975, 10)).toBeCloseTo(2.228, 2);
    expect(tInv(0.975, 4)).toBeCloseTo(2.776, 2);
    expect(tInv(0.95, 20)).toBeCloseTo(1.725, 2);
  });

  it("t CDF é coerente", () => {
    expect(tCdf(0, 5)).toBeCloseTo(0.5, 6);
    expect(tCdf(2.571, 5)).toBeCloseTo(0.975, 3);
  });

  it("qui-quadrado: valor crítico 5% com 1 gl ≈ 3.841", () => {
    expect(chiSqSf(3.841, 1)).toBeCloseTo(0.05, 3);
    expect(chiSqSf(11.07, 5)).toBeCloseTo(0.05, 2);
  });

  it("F de cauda superior", () => {
    // F(1,4) = 13.5 -> p ~ 0.0213
    const p = fSf(13.5, 1, 4);
    expect(p).toBeGreaterThan(0.015);
    expect(p).toBeLessThan(0.03);
    // F crítico ~ 0.05: F(2,12)=3.885 -> p ~ 0.05
    expect(fSf(3.885, 2, 12)).toBeCloseTo(0.05, 2);
  });
});

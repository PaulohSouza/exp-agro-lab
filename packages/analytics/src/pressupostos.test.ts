import { describe, it, expect } from "vitest";
import { bartlett, shapiroWilk, sugerirRota } from "./pressupostos.js";
import type { ObservacaoModelo } from "./transform.js";

describe("bartlett", () => {
  it("variâncias iguais → não significativo", () => {
    const r = bartlett([
      [1, 2, 3, 4, 5],
      [11, 12, 13, 14, 15],
    ]);
    expect(r.p).toBeGreaterThan(0.05);
  });
  it("variâncias muito diferentes → significativo", () => {
    const r = bartlett([
      [1, 2, 3, 4, 5],
      [1, 50, 100, 200, 400],
    ]);
    expect(r.p).toBeLessThan(0.05);
  });
});

describe("shapiroWilk (Royston AS R94)", () => {
  it("n=3 [1,2,3] → W=1, p=1 (caso exato)", () => {
    const r = shapiroWilk([1, 2, 3]);
    expect(r.W).toBeCloseTo(1, 6);
    expect(r.p).toBeCloseTo(1, 6);
  });

  it("[1,2,3,4] confere com o R (W≈0.9929, p≈0.971)", () => {
    const r = shapiroWilk([1, 2, 3, 4]);
    expect(r.W).toBeCloseTo(0.9929, 3);
    expect(r.p).toBeCloseTo(0.971, 2);
  });

  it("outlier forte → W baixo e p significativo", () => {
    const r = shapiroWilk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100]);
    expect(r.W).toBeLessThan(0.6);
    expect(r.p).toBeLessThan(0.01);
  });

  it("amostra ~simétrica → não rejeita normalidade", () => {
    const r = shapiroWilk([2, 3, 4, 4, 5, 5, 5, 6, 6, 7, 8]);
    expect(r.p).toBeGreaterThan(0.1);
  });

  it("rejeita n<3 e variância nula", () => {
    expect(() => shapiroWilk([1, 2])).toThrow();
    expect(() => shapiroWilk([5, 5, 5, 5])).toThrow();
  });
});

describe("sugerirRota", () => {
  const grupo = (g: string, vs: number[], bloco = false): ObservacaoModelo[] =>
    vs.map((v, i) => ({ grupo: g, bloco: bloco ? i + 1 : undefined, valor: v }));

  it("dados bem comportados → rota paramétrica", () => {
    const obs = [
      ...grupo("A", [10, 11, 9, 10, 11]),
      ...grupo("B", [20, 21, 19, 20, 21]),
      ...grupo("C", [30, 29, 31, 30, 29]),
    ];
    const r = sugerirRota(obs);
    expect(r.rota).toBe("parametrica");
    expect(r.normalidade.W).toBeGreaterThan(0);
  });

  it("variância proporcional à média (positivos) → sugere transformação", () => {
    const obs = [
      ...grupo("A", [5, 4, 6, 5, 4, 6]),
      ...grupo("B", [50, 30, 70, 45, 35, 65]),
      ...grupo("C", [400, 250, 560, 420, 300, 520]),
    ];
    const r = sugerirRota(obs);
    expect(["transformacao", "naoParametrico"]).toContain(r.rota);
    if (r.rota === "transformacao") expect(r.transformacaoSugerida).toBeTruthy();
  });
});

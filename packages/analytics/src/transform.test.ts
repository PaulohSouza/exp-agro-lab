import { describe, it, expect } from "vitest";
import {
  aplicarTransformacao,
  retroTransformar,
  boxCoxLambda,
  sugerirTransformacao,
  type ObservacaoModelo,
} from "./transform.js";

describe("aplicarTransformacao (golden)", () => {
  it("raiz √x", () => {
    const t = aplicarTransformacao([16, 9, 0], "raiz");
    expect(t.valores).toEqual([4, 3, 0]);
    expect(t.descricao).toBe("√(x)");
  });
  it("log(x+1) é o padrão", () => {
    const t = aplicarTransformacao([9, 0], "log");
    expect(t.constante).toBe(1);
    expect(t.valores[0]).toBeCloseTo(Math.log(10), 6);
    expect(t.valores[1]).toBeCloseTo(0, 6); // log(0+1)=0
    expect(t.descricao).toBe("log(x+1)");
  });
  it("box-cox com λ=0,5", () => {
    const t = aplicarTransformacao([4], "boxcox", { lambda: 0.5 });
    expect(t.valores[0]).toBeCloseTo(2, 6); // (4^0.5 − 1)/0.5 = 2
    expect(t.lambda).toBe(0.5);
  });
  it("box-cox λ=0 vira log", () => {
    const t = aplicarTransformacao([Math.E], "boxcox", { lambda: 0 });
    expect(t.valores[0]).toBeCloseTo(1, 6);
  });
  it("rejeita domínios inválidos", () => {
    expect(() => aplicarTransformacao([-1], "raiz")).toThrow();
    expect(() => aplicarTransformacao([-2], "log")).toThrow(); // -2+1 ≤ 0
    expect(() => aplicarTransformacao([1], "boxcox")).toThrow(); // sem λ
    expect(() => aplicarTransformacao([0], "boxcox", { lambda: 0.5 })).toThrow(); // ≤ 0
  });
});

describe("retroTransformar (round-trip)", () => {
  it("retorna à escala original", () => {
    expect(retroTransformar(4, "raiz")).toBeCloseTo(16, 6);
    expect(retroTransformar(Math.log(10), "log")).toBeCloseTo(9, 6); // exp − 1
    expect(retroTransformar(2, "boxcox", { lambda: 0.5 })).toBeCloseTo(4, 6); // (0.5·2+1)^2
    expect(retroTransformar(1, "boxcox", { lambda: 0 })).toBeCloseTo(Math.E, 6);
    expect(retroTransformar(7, "nenhuma")).toBe(7);
  });
});

// Dataset "ideal" (aditivo + variância constante na escala z) → λ deve sair ~1.
const Z = [
  ["A", 2.0],
  ["A", 2.1],
  ["A", 1.9],
  ["A", 2.0],
  ["B", 3.0],
  ["B", 3.1],
  ["B", 2.9],
  ["B", 3.0],
  ["C", 4.0],
  ["C", 4.1],
  ["C", 3.9],
  ["C", 4.0],
] as const;

const obsDe = (f: (z: number) => number): ObservacaoModelo[] =>
  Z.map(([g, z]) => ({ grupo: g, valor: f(z) }));

describe("boxCoxLambda (verossimilhança perfilada)", () => {
  it("dados na escala ideal → λ ≈ 1", () => {
    const r = boxCoxLambda(obsDe((z) => z));
    expect(r.lambda).toBeGreaterThan(0.6);
    expect(r.lambda).toBeLessThan(1.4);
    expect(r.intervalo95[0]).toBeLessThanOrEqual(r.lambda);
    expect(r.intervalo95[1]).toBeGreaterThanOrEqual(r.lambda);
    expect(r.perfil.length).toBeGreaterThan(10);
  });
  it("dados ao quadrado → λ ≈ 0,5 (raiz)", () => {
    const r = boxCoxLambda(obsDe((z) => z * z));
    expect(r.lambda).toBeGreaterThan(0.2);
    expect(r.lambda).toBeLessThan(0.8);
  });
  it("dados exponenciados → λ ≈ 0 (log)", () => {
    const r = boxCoxLambda(obsDe((z) => Math.exp(z)));
    expect(r.lambda).toBeGreaterThan(-0.3);
    expect(r.lambda).toBeLessThan(0.3);
  });
  it("rejeita valores não positivos", () => {
    expect(() => boxCoxLambda(obsDe((z) => z - 5))).toThrow();
  });
});

describe("sugerirTransformacao", () => {
  it("mapeia λ para a transformação padrão mais próxima", () => {
    expect(sugerirTransformacao(obsDe((z) => z)).recomendada).toBe("nenhuma");
    expect(sugerirTransformacao(obsDe((z) => z * z)).recomendada).toBe("raiz");
    expect(sugerirTransformacao(obsDe((z) => Math.exp(z))).recomendada).toBe("log");
  });
});

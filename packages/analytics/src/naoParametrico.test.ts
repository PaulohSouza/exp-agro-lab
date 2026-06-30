import { describe, it, expect } from "vitest";
import { kruskalWallis, friedman, type ObservacaoNP } from "./naoParametrico.js";

const letra = (g: { grupo: string; letra?: string }[], nome: string) =>
  g.find((x) => x.grupo === nome)!.letra;

describe("kruskalWallis (golden)", () => {
  // 3 grupos perfeitamente separados, sem empates → H = 7,2.
  const obs: ObservacaoNP[] = [
    { grupo: "A", valor: 1 },
    { grupo: "A", valor: 2 },
    { grupo: "A", valor: 3 },
    { grupo: "B", valor: 4 },
    { grupo: "B", valor: 5 },
    { grupo: "B", valor: 6 },
    { grupo: "C", valor: 7 },
    { grupo: "C", valor: 8 },
    { grupo: "C", valor: 9 },
  ];
  const r = kruskalWallis(obs);

  it("H, gl e p conferem (sem empates)", () => {
    expect(r.H).toBeCloseTo(7.2, 6);
    expect(r.gl).toBe(2);
    expect(r.p).toBeCloseTo(Math.exp(-3.6), 6); // χ²(2): SF = e^(−H/2)
    expect(r.correcaoEmpates).toBeCloseTo(1, 6);
    expect(r.significativo).toBe(true);
  });

  it("médias de rank e Dunn separam os extremos", () => {
    expect(r.grupos.find((g) => g.grupo === "A")!.mediaRank).toBeCloseTo(2, 6);
    expect(r.grupos.find((g) => g.grupo === "C")!.mediaRank).toBeCloseTo(8, 6);
    const ac = r.postHoc.comparacoes.find(
      (c) => (c.a === "A" && c.b === "C") || (c.a === "C" && c.b === "A"),
    )!;
    expect(ac.significativo).toBe(true); // pAjustado ≈ 0,022
    expect(letra(r.grupos, "C")).toBe("a");
    expect(letra(r.grupos, "A")).toBe("b");
    expect(letra(r.grupos, "B")).toBe("ab");
  });

  it("correção de empates reduz C (<1) quando há amarrações", () => {
    const comEmpates = kruskalWallis([
      { grupo: "A", valor: 1 },
      { grupo: "A", valor: 1 },
      { grupo: "B", valor: 1 },
      { grupo: "B", valor: 2 },
      { grupo: "C", valor: 2 },
      { grupo: "C", valor: 3 },
    ]);
    expect(comEmpates.correcaoEmpates).toBeLessThan(1);
    expect(comEmpates.H).toBeGreaterThanOrEqual(0);
  });

  it("rejeita menos de 2 grupos", () => {
    expect(() =>
      kruskalWallis([
        { grupo: "A", valor: 1 },
        { grupo: "A", valor: 2 },
        { grupo: "A", valor: 3 },
      ]),
    ).toThrow();
  });
});

describe("friedman (golden)", () => {
  // 4 blocos, 3 tratamentos, concordância perfeita → χ²F = b(k−1) = 8.
  const obs: ObservacaoNP[] = [];
  for (const bl of [1, 2, 3, 4]) {
    obs.push(
      { bloco: bl, grupo: "A", valor: 1 },
      { bloco: bl, grupo: "B", valor: 2 },
      { bloco: bl, grupo: "C", valor: 3 },
    );
  }
  const r = friedman(obs);

  it("χ²F, gl e p conferem (sem empates)", () => {
    expect(r.qui2).toBeCloseTo(8, 6);
    expect(r.gl).toBe(2);
    expect(r.p).toBeCloseTo(Math.exp(-4), 6); // χ²(2): SF = e^(−χ²/2)
    expect(r.blocos).toBe(4);
    expect(r.tratamentos).toBe(3);
    expect(r.significativo).toBe(true);
  });

  it("Nemenyi separa os extremos e atribui letras", () => {
    expect(r.grupos.find((g) => g.grupo === "C")!.mediaRank).toBeCloseTo(3, 6);
    expect(r.grupos.find((g) => g.grupo === "A")!.mediaRank).toBeCloseTo(1, 6);
    expect(r.postHoc.cd).toBeGreaterThan(0);
    expect(letra(r.grupos, "C")).toBe("a");
    expect(letra(r.grupos, "A")).toBe("b");
  });

  it("rejeita dados incompletos", () => {
    expect(() => friedman(obs.slice(0, 11))).toThrow();
  });
});

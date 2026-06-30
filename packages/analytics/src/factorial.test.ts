import { describe, it, expect } from "vitest";
import { anovaFatorial, type ObservacaoFatorial } from "./factorial.js";

const linha = (r: ReturnType<typeof anovaFatorial>, fonte: string) =>
  r.tabela.find((l) => l.fonte === fonte)!;

// --- Golden 1: fatorial 2×2 em DBC (2 blocos), SQ calculadas à mão. ---
// Mesma matriz do split-plot, mas com erro único (resíduo = SQ não explicada).
// Bloco1: A1B1=10 A1B2=12 A2B1=20 A2B2=24 · Bloco2: A1B1=14 A1B2=16 A2B1=22 A2B2=28
const DBC: ObservacaoFatorial[] = [
  { bloco: 1, fatores: ["A1", "B1"], valor: 10 },
  { bloco: 1, fatores: ["A1", "B2"], valor: 12 },
  { bloco: 1, fatores: ["A2", "B1"], valor: 20 },
  { bloco: 1, fatores: ["A2", "B2"], valor: 24 },
  { bloco: 2, fatores: ["A1", "B1"], valor: 14 },
  { bloco: 2, fatores: ["A1", "B2"], valor: 16 },
  { bloco: 2, fatores: ["A2", "B1"], valor: 22 },
  { bloco: 2, fatores: ["A2", "B2"], valor: 28 },
];

describe("anovaFatorial 2×2 (DBC, erro único)", () => {
  const r = anovaFatorial(DBC, { delineamento: "DBC" });

  it("média geral e SQ por fonte conferem (golden à mão)", () => {
    expect(r.mediaGeral).toBeCloseTo(18.25, 6);
    expect(linha(r, "Bloco").sq).toBeCloseTo(24.5, 6);
    expect(linha(r, "A").sq).toBeCloseTo(220.5, 6);
    expect(linha(r, "B").sq).toBeCloseTo(24.5, 6);
    expect(linha(r, "A × B").sq).toBeCloseTo(4.5, 6);
    expect(linha(r, "Resíduo").sq).toBeCloseTo(1.5, 6); // 275.5 − 24.5 − 220.5 − 24.5 − 4.5
    expect(linha(r, "Total").sq).toBeCloseTo(275.5, 6);
  });

  it("um único erro com gl = 3 e QM = 0,5", () => {
    expect(r.glResiduo).toBe(3);
    expect(r.qmResiduo).toBeCloseTo(0.5, 6);
    expect(r.tabela.filter((l) => l.fonte === "Resíduo").length).toBe(1);
  });

  it("F = QMefeito / QMresíduo para todos os efeitos", () => {
    expect(linha(r, "A").f).toBeCloseTo(441, 6); // 220.5 / 0.5
    expect(linha(r, "B").f).toBeCloseTo(49, 6); // 24.5 / 0.5
    expect(linha(r, "A × B").f).toBeCloseTo(9, 6); // 4.5 / 0.5
  });

  it("SQ é aditiva e GL somam ao total", () => {
    const fontes = ["Bloco", "A", "B", "A × B", "Resíduo"];
    expect(fontes.map((f) => linha(r, f).sq).reduce((a, b) => a + b, 0)).toBeCloseTo(275.5, 6);
    expect(fontes.map((f) => linha(r, f).gl).reduce((a, b) => a + b, 0)).toBe(linha(r, "Total").gl);
  });

  it("médias marginais por fator com letras", () => {
    const a = r.efeitosPrincipais.find((e) => e.fator === "A")!;
    expect(a.medias.find((m) => m.nivel === "A1")!.media).toBeCloseTo(13, 6);
    expect(a.medias.find((m) => m.nivel === "A2")!.media).toBeCloseTo(23.5, 6);
    expect(a.medias.every((m) => typeof m.letra === "string")).toBe(true);
  });
});

// --- Golden 2: fatorial 2×2 em DIC (r=2) com interação forte (cruzada). ---
// A1B1=10,12 A1B2=20,22 A2B1=22,20 A2B2=12,10  → sem efeitos principais, só A×B.
const DIC: ObservacaoFatorial[] = [
  { fatores: ["A1", "B1"], valor: 10 },
  { fatores: ["A1", "B1"], valor: 12 },
  { fatores: ["A1", "B2"], valor: 20 },
  { fatores: ["A1", "B2"], valor: 22 },
  { fatores: ["A2", "B1"], valor: 22 },
  { fatores: ["A2", "B1"], valor: 20 },
  { fatores: ["A2", "B2"], valor: 12 },
  { fatores: ["A2", "B2"], valor: 10 },
];

describe("anovaFatorial 2×2 (DIC) com desdobramento", () => {
  const r = anovaFatorial(DIC);

  it("efeitos principais nulos e interação dominante", () => {
    expect(linha(r, "A").sq).toBeCloseTo(0, 6);
    expect(linha(r, "B").sq).toBeCloseTo(0, 6);
    expect(linha(r, "A × B").sq).toBeCloseTo(200, 6);
    expect(linha(r, "Resíduo").sq).toBeCloseTo(8, 6);
    expect(r.glResiduo).toBe(4);
    expect(r.qmResiduo).toBeCloseTo(2, 6); // 8 / 4
    expect(r.interacoes.find((i) => i.fonte === "A × B")!.significativo).toBe(true);
  });

  it("desdobra a interação significativa nos dois sentidos", () => {
    expect(r.desdobramentos.map((d) => d.descricao)).toEqual([
      "A dentro de cada nível de B",
      "B dentro de cada nível de A",
    ]);
  });

  it("efeitos simples: SQ(A/B) soma = SQ(A) + SQ(A×B)", () => {
    const aDentroB = r.desdobramentos.find((d) => d.fatorAlvo === "A")!;
    const somaSq = aDentroB.efeitos.reduce((a, e) => a + e.sq, 0);
    expect(somaSq).toBeCloseTo(0 + 200, 6);
    // dentro de B1: A1=11 vs A2=21 → F = 100/2 = 50, significativo
    const emB1 = aDentroB.efeitos.find((e) => e.nivelCondicao === "B1")!;
    expect(emB1.sq).toBeCloseTo(100, 6);
    expect(emB1.f).toBeCloseTo(50, 6);
    expect(emB1.significativo).toBe(true);
    const letras = emB1.medias.map((m) => m.letra);
    expect(new Set(letras).size).toBe(2); // médias diferem → letras distintas
  });
});

// --- Golden 3: fatorial 2×2×2 em DIC (r=2) — aditividade e fonte tripla. ---
const TRES: ObservacaoFatorial[] = [];
let v = 0;
for (let rep = 0; rep < 2; rep++) {
  for (const a of ["A1", "A2"]) {
    for (const b of ["B1", "B2"]) {
      for (const c of ["C1", "C2"]) {
        TRES.push({ fatores: [a, b, c], valor: 10 + ((v++ * 7) % 13) });
      }
    }
  }
}

describe("anovaFatorial 2×2×2 (3 fatores)", () => {
  const r = anovaFatorial(TRES, { rotulos: ["A", "B", "C"] });

  it("tem todas as fontes incl. interação tripla A × B × C", () => {
    for (const f of ["A", "B", "C", "A × B", "A × C", "B × C", "A × B × C", "Resíduo", "Total"]) {
      expect(linha(r, f)).toBeTruthy();
    }
  });

  it("SQ aditiva e GL fecham (resíduo = 8 em 2×2×2 r=2 DIC)", () => {
    const efeitos = ["A", "B", "C", "A × B", "A × C", "B × C", "A × B × C", "Resíduo"];
    expect(efeitos.map((f) => linha(r, f).sq).reduce((a, b) => a + b, 0)).toBeCloseTo(
      linha(r, "Total").sq,
      6,
    );
    expect(efeitos.map((f) => linha(r, f).gl).reduce((a, b) => a + b, 0)).toBe(linha(r, "Total").gl);
    expect(r.glResiduo).toBe(8); // 15 − 7 efeitos
  });
});

describe("anovaFatorial — validações", () => {
  it("rejeita dados desbalanceados (combinação faltando)", () => {
    expect(() => anovaFatorial(DIC.slice(0, 7))).toThrow();
  });
  it("rejeita número de fatores fora de 2–3", () => {
    expect(() =>
      anovaFatorial([
        { fatores: ["A1"], valor: 1 },
        { fatores: ["A2"], valor: 2 },
        { fatores: ["A1"], valor: 3 },
        { fatores: ["A2"], valor: 4 },
      ]),
    ).toThrow();
  });
});

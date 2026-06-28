import { describe, it, expect } from "vitest";
import { anovaUmFator } from "./anova.js";
import type { Observacao } from "./types.js";

describe("ANOVA 1 fator DIC (cálculo conhecido)", () => {
  // A=[1,2,3], B=[4,5,6] -> SQtotal=17.5, SQtrat=13.5, SQres=4, F=13.5
  const obs: Observacao[] = [
    { tratamento: "A", valor: 1 }, { tratamento: "A", valor: 2 }, { tratamento: "A", valor: 3 },
    { tratamento: "B", valor: 4 }, { tratamento: "B", valor: 5 }, { tratamento: "B", valor: 6 },
  ];
  const r = anovaUmFator(obs, "DIC");

  it("SQ e F batem com o cálculo manual", () => {
    const total = r.tabela.find((l) => l.fonte === "Total")!;
    const trat = r.tabela.find((l) => l.fonte === "Tratamento")!;
    const res = r.tabela.find((l) => l.fonte === "Resíduo")!;
    expect(total.sq).toBeCloseTo(17.5, 6);
    expect(trat.sq).toBeCloseTo(13.5, 6);
    expect(res.sq).toBeCloseTo(4, 6);
    expect(r.fTratamento).toBeCloseTo(13.5, 6);
    expect(r.mediaGeral).toBeCloseTo(3.5, 6);
  });

  it("decomposição: SQtrat + SQres = SQtotal", () => {
    const trat = r.tabela.find((l) => l.fonte === "Tratamento")!.sq;
    const res = r.tabela.find((l) => l.fonte === "Resíduo")!.sq;
    const total = r.tabela.find((l) => l.fonte === "Total")!.sq;
    expect(trat + res).toBeCloseTo(total, 6);
  });

  it("letras: A e B diferem", () => {
    const la = r.medias.find((m) => m.tratamento === "A")!.letra;
    const lb = r.medias.find((m) => m.tratamento === "B")!.letra;
    expect(la).not.toBe(lb);
  });
});

describe("LSD: agrupamento de letras", () => {
  const obs: Observacao[] = [
    { tratamento: "A", valor: 30 }, { tratamento: "A", valor: 30.5 }, { tratamento: "A", valor: 29.5 },
    { tratamento: "B", valor: 20 }, { tratamento: "B", valor: 20.5 }, { tratamento: "B", valor: 19.5 },
    { tratamento: "C", valor: 20.5 }, { tratamento: "C", valor: 21 }, { tratamento: "C", valor: 20 },
  ];
  const r = anovaUmFator(obs, "DIC");

  it("A separado; B e C compartilham letra", () => {
    const la = r.medias.find((m) => m.tratamento === "A")!.letra!;
    const lb = r.medias.find((m) => m.tratamento === "B")!.letra!;
    const lc = r.medias.find((m) => m.tratamento === "C")!.letra!;
    expect(la).toBe("a");
    expect(lb).toBe(lc);
    expect(lb).not.toBe("a");
  });
});

describe("ANOVA DBC (decomposição com bloco)", () => {
  const obs: Observacao[] = [];
  const valores: Record<string, number[]> = { T1: [10, 12, 11, 13], T2: [15, 16, 14, 17], T3: [20, 19, 21, 22] };
  for (const t of Object.keys(valores)) valores[t].forEach((v, b) => obs.push({ tratamento: t, bloco: b + 1, valor: v }));
  const r = anovaUmFator(obs, "DBC");

  it("SQtrat + SQbloco + SQres = SQtotal", () => {
    const get = (f: string) => r.tabela.find((l) => l.fonte === f)!.sq;
    expect(get("Tratamento") + get("Bloco") + get("Resíduo")).toBeCloseTo(get("Total"), 6);
    expect(r.glResiduo).toBe(6); // (3-1)*(4-1)
    expect(r.fTratamento).toBeGreaterThan(0);
  });
});

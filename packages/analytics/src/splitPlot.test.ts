import { describe, it, expect } from "vitest";
import { anovaSplitPlot, type ObservacaoSplit } from "./splitPlot.js";

// Dataset golden (2 blocos × 2 níveis A × 2 níveis B), SS calculados à mão.
// Bloco1: A1B1=10 A1B2=12 A2B1=20 A2B2=24 · Bloco2: A1B1=14 A1B2=16 A2B1=22 A2B2=28
const DADOS: ObservacaoSplit[] = [
  { bloco: 1, fatorA: "A1", fatorB: "B1", valor: 10 },
  { bloco: 1, fatorA: "A1", fatorB: "B2", valor: 12 },
  { bloco: 1, fatorA: "A2", fatorB: "B1", valor: 20 },
  { bloco: 1, fatorA: "A2", fatorB: "B2", valor: 24 },
  { bloco: 2, fatorA: "A1", fatorB: "B1", valor: 14 },
  { bloco: 2, fatorA: "A1", fatorB: "B2", valor: 16 },
  { bloco: 2, fatorA: "A2", fatorB: "B1", valor: 22 },
  { bloco: 2, fatorA: "A2", fatorB: "B2", valor: 28 },
];

const linha = (r: ReturnType<typeof anovaSplitPlot>, fonte: string) =>
  r.tabela.find((l) => l.fonte === fonte)!;

describe("anovaSplitPlot (DBC)", () => {
  const r = anovaSplitPlot(DADOS);

  it("média geral e SQ por fonte conferem (golden à mão)", () => {
    expect(r.mediaGeral).toBeCloseTo(18.25, 6);
    expect(linha(r, "Bloco").sq).toBeCloseTo(24.5, 6);
    expect(linha(r, "Fator A (parcela)").sq).toBeCloseTo(220.5, 6);
    expect(linha(r, "Erro(a)").sq).toBeCloseTo(0.5, 6);
    expect(linha(r, "Fator B (subparcela)").sq).toBeCloseTo(24.5, 6);
    expect(linha(r, "A × B").sq).toBeCloseTo(4.5, 6);
    expect(linha(r, "Erro(b)").sq).toBeCloseTo(1.0, 6);
    expect(linha(r, "Total").sq).toBeCloseTo(275.5, 6);
  });

  it("graus de liberdade conferem e somam ao total", () => {
    expect(linha(r, "Fator A (parcela)").gl).toBe(1);
    expect(linha(r, "Erro(a)").gl).toBe(1);
    expect(linha(r, "Erro(b)").gl).toBe(2);
    const total = linha(r, "Total").gl;
    const partes = [
      "Bloco",
      "Fator A (parcela)",
      "Erro(a)",
      "Fator B (subparcela)",
      "A × B",
      "Erro(b)",
    ]
      .map((f) => linha(r, f).gl)
      .reduce((a, b) => a + b, 0);
    expect(partes).toBe(total);
  });

  it("SQ é aditiva (total = soma das fontes)", () => {
    const partes = [
      "Bloco",
      "Fator A (parcela)",
      "Erro(a)",
      "Fator B (subparcela)",
      "A × B",
      "Erro(b)",
    ]
      .map((f) => linha(r, f).sq)
      .reduce((a, b) => a + b, 0);
    expect(partes).toBeCloseTo(linha(r, "Total").sq, 6);
  });

  it("F usa o erro correto: A pelo Erro(a); B e A×B pelo Erro(b)", () => {
    expect(r.fatorA.f).toBeCloseTo(441, 4); // 220.5 / 0.5
    expect(r.fatorB.f).toBeCloseTo(49, 4); // 24.5 / 0.5
    expect(r.interacao.f).toBeCloseTo(9, 4); // 4.5 / 0.5
    expect(r.fatorA.significativo).toBe(true);
  });

  it("dois CVs e médias por nível", () => {
    expect(r.cvParcela).toBeGreaterThan(0);
    expect(r.cvSubparcela).toBeGreaterThan(0);
    expect(r.mediasA.find((m) => m.nivel === "A2")!.media).toBeCloseTo(23.5, 6);
    expect(r.mediasB.find((m) => m.nivel === "B2")!.media).toBeCloseTo(20, 6);
  });

  it("rejeita dados desbalanceados", () => {
    expect(() => anovaSplitPlot(DADOS.slice(0, 7))).toThrow();
  });
});

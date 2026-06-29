import { describe, it, expect } from "vitest";
import {
  calcularAreaUtilColhida,
  calcularProdutividadeKgHa,
  calcularSaida,
  dedupLancamentos,
} from "./avaliacao.js";

describe("dedupLancamentos (coleta em lote)", () => {
  it("mantém o último por (avaliação, parcela, amostra)", () => {
    const r = dedupLancamentos([
      { avaliacaoId: "a", parcelaId: "p1", valorColetado: 1 },
      { avaliacaoId: "a", parcelaId: "p1", valorColetado: 9 },
      { avaliacaoId: "b", parcelaId: "p1", valorColetado: 2 },
    ]);
    expect(r).toHaveLength(2);
    expect(r.find((x) => x.avaliacaoId === "a")!.valorColetado).toBe(9);
  });
  it("distingue por amostra", () => {
    const r = dedupLancamentos([
      { avaliacaoId: "a", parcelaId: "p1", numAmostra: 1, valorColetado: 1 },
      { avaliacaoId: "a", parcelaId: "p1", numAmostra: 2, valorColetado: 2 },
    ]);
    expect(r).toHaveLength(2);
  });
});

describe("RN-PROD (produtividade kg/parcela → kg/ha)", () => {
  it("área útil = linhas × espaçamento × comprimento (exemplo PC1699)", () => {
    // espaçamento 4,05/9 = 0,45 m; colheita 4 linhas × 5 m
    const area = calcularAreaUtilColhida({
      numLinhasColhidas: 4,
      espacamentoLinhasM: 0.45,
      comprimentoColhidoM: 5,
    });
    expect(area).toBeCloseTo(9.0, 6);
  });

  it("8,5 kg em 9,0 m² ≈ 9.444 kg/ha", () => {
    const kgha = calcularProdutividadeKgHa({ valorKgParcela: 8.5, areaUtilM2: 9.0 });
    expect(kgha).toBeCloseTo(9444.44, 1);
  });

  it("rejeita parâmetros não positivos", () => {
    expect(() => calcularAreaUtilColhida({ numLinhasColhidas: 0, espacamentoLinhasM: 0.45, comprimentoColhidoM: 5 })).toThrow();
    expect(() => calcularProdutividadeKgHa({ valorKgParcela: 8.5, areaUtilM2: 0 })).toThrow();
  });
});

describe("RN-CALC (fórmula genérica segura)", () => {
  it("avalia produtividade via fórmula", () => {
    const r = calcularSaida({
      valorColetado: 8.5,
      formula: "(valor / areaUtil) * 10000",
      params: { areaUtil: 9.0 },
    });
    expect(r).toBeCloseTo(9444.44, 1);
  });

  it("respeita precedência e parênteses", () => {
    expect(calcularSaida({ valorColetado: 0, formula: "2 + 3 * 4" })).toBe(14);
    expect(calcularSaida({ valorColetado: 0, formula: "(2 + 3) * 4" })).toBe(20);
  });

  it("suporta menos unário", () => {
    expect(calcularSaida({ valorColetado: 10, formula: "-valor + 5" })).toBe(-5);
  });

  it("erra em divisão por zero, variável ausente e caractere inválido", () => {
    expect(() => calcularSaida({ valorColetado: 1, formula: "valor / 0" })).toThrow();
    expect(() => calcularSaida({ valorColetado: 1, formula: "valor + x" })).toThrow();
    expect(() => calcularSaida({ valorColetado: 1, formula: "valor & 2" })).toThrow();
  });
});

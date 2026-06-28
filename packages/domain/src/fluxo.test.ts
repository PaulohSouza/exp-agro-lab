import { describe, it, expect } from "vitest";
import { podeTransicionar, transicoesPermitidas } from "./fluxo.js";

describe("RN-FLUXO (transições de status)", () => {
  it("comercial passa por aprovação CAD antes de conduzir", () => {
    expect(podeTransicionar("comercial", "Inserindo", "AprovadoCAD")).toBe(true);
    expect(podeTransicionar("comercial", "AprovadoCAD", "EmConducao")).toBe(true);
    // não pode pular a aprovação
    expect(podeTransicionar("comercial", "Inserindo", "EmConducao")).toBe(false);
  });

  it("interno vai direto de Inserindo para EmConducao", () => {
    expect(podeTransicionar("interno", "Inserindo", "EmConducao")).toBe(true);
  });

  it("Concluido é terminal", () => {
    expect(transicoesPermitidas("interno", "Concluido")).toEqual([]);
    expect(transicoesPermitidas("comercial", "Concluido")).toEqual([]);
  });
});

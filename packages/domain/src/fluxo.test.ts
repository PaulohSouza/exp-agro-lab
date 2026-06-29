import { describe, it, expect } from "vitest";
import { podeTransicionar, transicoesPermitidas } from "./fluxo.js";

describe("RN-FLUXO (transições de status)", () => {
  it("COMERCIAL passa por aprovação CAD antes de conduzir", () => {
    expect(podeTransicionar("COMERCIAL", "INSERINDO", "APROVADO_CAD")).toBe(true);
    expect(podeTransicionar("COMERCIAL", "APROVADO_CAD", "EM_CONDUCAO")).toBe(true);
    // não pode pular a aprovação
    expect(podeTransicionar("COMERCIAL", "INSERINDO", "EM_CONDUCAO")).toBe(false);
  });

  it("INTERNO vai direto de INSERINDO para EM_CONDUCAO", () => {
    expect(podeTransicionar("INTERNO", "INSERINDO", "EM_CONDUCAO")).toBe(true);
  });

  it("CONCLUIDO é terminal", () => {
    expect(transicoesPermitidas("INTERNO", "CONCLUIDO")).toEqual([]);
    expect(transicoesPermitidas("COMERCIAL", "CONCLUIDO")).toEqual([]);
  });
});

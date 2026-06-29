import { describe, it, expect } from "vitest";
import { validarApontamento, apontamentoEsperado, type CampoDef } from "./atividade.js";

// Ex.: aplicação via CO2 → vento (num), umidade (num), data (data)
const camposCO2: CampoDef[] = [
  { rotulo: "vento", tipo: "numero", obrigatorio: true },
  { rotulo: "umidade", tipo: "numero", obrigatorio: true },
  { rotulo: "data", tipo: "data", obrigatorio: true },
];

describe("validarApontamento", () => {
  it("aceita apontamento completo e correto", () => {
    const erros = validarApontamento(camposCO2, [
      { rotulo: "vento", valorNum: 3.2 },
      { rotulo: "umidade", valorNum: 65 },
      { rotulo: "data", valorData: "2026-06-29" },
    ]);
    expect(erros).toEqual([]);
  });

  it("acusa campo obrigatório faltando", () => {
    const erros = validarApontamento(camposCO2, [
      { rotulo: "vento", valorNum: 3.2 },
      { rotulo: "umidade", valorNum: 65 },
    ]);
    expect(erros).toContain("Campo obrigatório não preenchido: data");
  });

  it("acusa número não preenchido (null) em campo obrigatório", () => {
    const erros = validarApontamento(camposCO2, [
      { rotulo: "vento", valorNum: null },
      { rotulo: "umidade", valorNum: 65 },
      { rotulo: "data", valorData: "2026-06-29" },
    ]);
    expect(erros).toContain("Campo obrigatório não preenchido: vento");
  });

  it("acusa tipo divergente (texto onde se espera número)", () => {
    const erros = validarApontamento(
      [{ rotulo: "vento", tipo: "numero", obrigatorio: true }],
      [{ rotulo: "vento", valorTexto: "forte" }],
    );
    expect(erros.some((e) => e.includes("vento"))).toBe(true);
  });

  it("acusa rótulo desconhecido", () => {
    const erros = validarApontamento(camposCO2, [
      { rotulo: "vento", valorNum: 3 },
      { rotulo: "umidade", valorNum: 60 },
      { rotulo: "data", valorData: "2026-06-29" },
      { rotulo: "temperatura", valorNum: 28 },
    ]);
    expect(erros).toContain("Campo desconhecido: temperatura");
  });

  it("campo opcional ausente não gera erro", () => {
    const erros = validarApontamento(
      [{ rotulo: "obs", tipo: "texto", obrigatorio: false }],
      [],
    );
    expect(erros).toEqual([]);
  });
});

describe("apontamentoEsperado", () => {
  it("ação não tem apontamento; apontamento tem", () => {
    expect(apontamentoEsperado("acao")).toBe(false);
    expect(apontamentoEsperado("apontamento")).toBe(true);
  });
});

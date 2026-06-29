import { describe, it, expect } from "vitest";
import {
  validarApontamento,
  apontamentoEsperado,
  marcosPadrao,
  statusMarco,
  type CampoDef,
} from "./atividade.js";

// Ex.: aplicação via CO2 → vento (num), umidade (num), data (data)
const camposCO2: CampoDef[] = [
  { rotulo: "vento", tipo: "numero", isObrigatorio: true },
  { rotulo: "umidade", tipo: "numero", isObrigatorio: true },
  { rotulo: "data", tipo: "data", isObrigatorio: true },
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
      [{ rotulo: "vento", tipo: "numero", isObrigatorio: true }],
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
    const erros = validarApontamento([{ rotulo: "obs", tipo: "texto", isObrigatorio: false }], []);
    expect(erros).toEqual([]);
  });
});

describe("apontamentoEsperado", () => {
  it("ação não tem apontamento; apontamento tem", () => {
    expect(apontamentoEsperado("acao")).toBe(false);
    expect(apontamentoEsperado("apontamento")).toBe(true);
  });
});

describe("marcos do cronograma", () => {
  it("não-cultura: implantação, início, fim", () => {
    expect(marcosPadrao(false)).toEqual(["implantacao", "inicio", "fim"]);
  });
  it("cultura: inclui semeadura e colheita antes do fim", () => {
    expect(marcosPadrao(true)).toEqual(["implantacao", "inicio", "semeadura", "colheita", "fim"]);
  });

  it("statusMarco: confirmado tem prioridade", () => {
    expect(
      statusMarco({ dataPrevista: "2020-01-01", isConfirmada: true, hojeISO: "2026-06-29" }),
    ).toBe("confirmado");
  });
  it("statusMarco: previsão no passado e não confirmado → atrasado", () => {
    expect(
      statusMarco({ dataPrevista: "2026-06-01", isConfirmada: false, hojeISO: "2026-06-29" }),
    ).toBe("atrasado");
  });
  it("statusMarco: previsão futura → pendente", () => {
    expect(
      statusMarco({ dataPrevista: "2026-12-01", isConfirmada: false, hojeISO: "2026-06-29" }),
    ).toBe("pendente");
  });
  it("statusMarco: sem data → pendente", () => {
    expect(statusMarco({ dataPrevista: null, isConfirmada: false, hojeISO: "2026-06-29" })).toBe(
      "pendente",
    );
  });
});

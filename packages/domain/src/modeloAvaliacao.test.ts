import { describe, it, expect } from "vitest";
import {
  modeloVisivel,
  modelosVisiveis,
  podeGerenciarEscopo,
  resolverPrerequisitos,
  type ModeloEscopoRef,
} from "./modeloAvaliacao.js";

const SISTEMA: ModeloEscopoRef = { id: "sis", escopo: "SISTEMA" };
const instA: ModeloEscopoRef = { id: "iA", escopo: "INSTITUICAO", instituicaoId: "A" };
const instB: ModeloEscopoRef = { id: "iB", escopo: "INSTITUICAO", instituicaoId: "B" };
const deptA1: ModeloEscopoRef = {
  id: "d1",
  escopo: "DEPARTAMENTO",
  instituicaoId: "A",
  departamentoId: "D1",
};
const deptA2: ModeloEscopoRef = {
  id: "d2",
  escopo: "DEPARTAMENTO",
  instituicaoId: "A",
  departamentoId: "D2",
};

describe("visibilidade por escopo", () => {
  const ctx = { instituicaoId: "A", departamentoId: "D1" };

  it("SISTEMA é sempre visível", () => {
    expect(modeloVisivel(SISTEMA, ctx)).toBe(true);
    expect(modeloVisivel(SISTEMA, {})).toBe(true);
  });

  it("instituição: só a do usuário", () => {
    expect(modeloVisivel(instA, ctx)).toBe(true);
    expect(modeloVisivel(instB, ctx)).toBe(false);
  });

  it("DEPARTAMENTO: só o do usuário", () => {
    expect(modeloVisivel(deptA1, ctx)).toBe(true);
    expect(modeloVisivel(deptA2, ctx)).toBe(false);
  });

  it("super-admin vê tudo", () => {
    const su = { isSuperAdmin: true };
    expect([instA, instB, deptA1, deptA2].every((m) => modeloVisivel(m, su))).toBe(true);
  });

  it("modelosVisiveis filtra e preserva ordem (os 3 escopos rotuláveis)", () => {
    const todos = [SISTEMA, instA, instB, deptA1, deptA2];
    expect(modelosVisiveis(todos, ctx).map((m) => m.id)).toEqual(["sis", "iA", "d1"]);
  });
});

describe("capacidade de gestão por papel", () => {
  it("ADMIN_SISTEMA gere qualquer escopo", () => {
    expect(podeGerenciarEscopo("ADMIN_SISTEMA", "SISTEMA")).toBe(true);
    expect(podeGerenciarEscopo("ADMIN_SISTEMA", "DEPARTAMENTO")).toBe(true);
  });
  it("GESTAO_INSTITUICAO: instituição e DEPARTAMENTO, nunca SISTEMA", () => {
    expect(podeGerenciarEscopo("GESTAO_INSTITUICAO", "INSTITUICAO")).toBe(true);
    expect(podeGerenciarEscopo("GESTAO_INSTITUICAO", "DEPARTAMENTO")).toBe(true);
    expect(podeGerenciarEscopo("GESTAO_INSTITUICAO", "SISTEMA")).toBe(false);
  });
  it("GESTAO_DEPARTAMENTO: só DEPARTAMENTO", () => {
    expect(podeGerenciarEscopo("GESTAO_DEPARTAMENTO", "DEPARTAMENTO")).toBe(true);
    expect(podeGerenciarEscopo("GESTAO_DEPARTAMENTO", "INSTITUICAO")).toBe(false);
  });
  it("papéis operacionais não gerem catálogo", () => {
    for (const e of ["SISTEMA", "INSTITUICAO", "DEPARTAMENTO"] as const) {
      expect(podeGerenciarEscopo("PESQUISADOR", e)).toBe(false);
      expect(podeGerenciarEscopo("ASSISTENTE", e)).toBe(false);
    }
  });
});

describe("fechamento transitivo de pré-requisitos", () => {
  // Produtividade -> Umidade; Umidade -> PMG (cadeia)
  const arestas = [
    { modeloId: "produtividade", prerequisitoId: "umidade" },
    { modeloId: "umidade", prerequisitoId: "pmg" },
  ];

  it("auto-adiciona o pré-requisito direto", () => {
    const r = resolverPrerequisitos(
      ["produtividade"],
      [{ modeloId: "produtividade", prerequisitoId: "umidade" }],
    );
    expect(r.todos).toEqual(["produtividade", "umidade"]);
    expect(r.adicionados).toEqual(["umidade"]);
  });

  it("resolve a cadeia transitiva", () => {
    const r = resolverPrerequisitos(["produtividade"], arestas);
    expect(r.todos).toEqual(["produtividade", "umidade", "pmg"]);
    expect(r.adicionados).toEqual(["umidade", "pmg"]);
  });

  it("não duplica quando o pré-requisito já está selecionado", () => {
    const r = resolverPrerequisitos(["produtividade", "umidade"], arestas);
    expect(r.todos).toEqual(["produtividade", "umidade", "pmg"]);
    expect(r.adicionados).toEqual(["pmg"]);
  });

  it("é seguro contra ciclos", () => {
    const ciclo = [
      { modeloId: "a", prerequisitoId: "b" },
      { modeloId: "b", prerequisitoId: "a" },
    ];
    const r = resolverPrerequisitos(["a"], ciclo);
    expect(new Set(r.todos)).toEqual(new Set(["a", "b"]));
    expect(r.todos.length).toBe(2);
  });

  it("sem pré-requisitos, devolve a própria seleção", () => {
    const r = resolverPrerequisitos(["x", "y"], []);
    expect(r.todos).toEqual(["x", "y"]);
    expect(r.adicionados).toEqual([]);
  });
});

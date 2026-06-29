import { describe, it, expect } from "vitest";
import {
  modeloVisivel,
  modelosVisiveis,
  podeGerenciarEscopo,
  resolverPrerequisitos,
  type ModeloEscopoRef,
} from "./modeloAvaliacao.js";

const sistema: ModeloEscopoRef = { id: "sis", escopo: "sistema" };
const instA: ModeloEscopoRef = { id: "iA", escopo: "instituicao", instituicaoId: "A" };
const instB: ModeloEscopoRef = { id: "iB", escopo: "instituicao", instituicaoId: "B" };
const deptA1: ModeloEscopoRef = { id: "d1", escopo: "departamento", instituicaoId: "A", departamentoId: "D1" };
const deptA2: ModeloEscopoRef = { id: "d2", escopo: "departamento", instituicaoId: "A", departamentoId: "D2" };

describe("visibilidade por escopo", () => {
  const ctx = { instituicaoId: "A", departamentoId: "D1" };

  it("sistema é sempre visível", () => {
    expect(modeloVisivel(sistema, ctx)).toBe(true);
    expect(modeloVisivel(sistema, {})).toBe(true);
  });

  it("instituição: só a do usuário", () => {
    expect(modeloVisivel(instA, ctx)).toBe(true);
    expect(modeloVisivel(instB, ctx)).toBe(false);
  });

  it("departamento: só o do usuário", () => {
    expect(modeloVisivel(deptA1, ctx)).toBe(true);
    expect(modeloVisivel(deptA2, ctx)).toBe(false);
  });

  it("super-admin vê tudo", () => {
    const su = { isSuperAdmin: true };
    expect([instA, instB, deptA1, deptA2].every((m) => modeloVisivel(m, su))).toBe(true);
  });

  it("modelosVisiveis filtra e preserva ordem (os 3 escopos rotuláveis)", () => {
    const todos = [sistema, instA, instB, deptA1, deptA2];
    expect(modelosVisiveis(todos, ctx).map((m) => m.id)).toEqual(["sis", "iA", "d1"]);
  });
});

describe("capacidade de gestão por papel", () => {
  it("admin_sistema gere qualquer escopo", () => {
    expect(podeGerenciarEscopo("admin_sistema", "sistema")).toBe(true);
    expect(podeGerenciarEscopo("admin_sistema", "departamento")).toBe(true);
  });
  it("gestao_instituicao: instituição e departamento, nunca sistema", () => {
    expect(podeGerenciarEscopo("gestao_instituicao", "instituicao")).toBe(true);
    expect(podeGerenciarEscopo("gestao_instituicao", "departamento")).toBe(true);
    expect(podeGerenciarEscopo("gestao_instituicao", "sistema")).toBe(false);
  });
  it("gestao_departamento: só departamento", () => {
    expect(podeGerenciarEscopo("gestao_departamento", "departamento")).toBe(true);
    expect(podeGerenciarEscopo("gestao_departamento", "instituicao")).toBe(false);
  });
  it("papéis operacionais não gerem catálogo", () => {
    for (const e of ["sistema", "instituicao", "departamento"] as const) {
      expect(podeGerenciarEscopo("pesquisador", e)).toBe(false);
      expect(podeGerenciarEscopo("assistente", e)).toBe(false);
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
    const r = resolverPrerequisitos(["produtividade"], [{ modeloId: "produtividade", prerequisitoId: "umidade" }]);
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

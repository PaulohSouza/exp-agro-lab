/**
 * Catálogo de avaliações multi-escopo (demanda A).
 * Regras puras: visibilidade por escopo, capacidade de gestão por papel e
 * fechamento transitivo de pré-requisitos.
 * @see SDD/04-design-detalhado/08-catalogo-avaliacoes.md
 */

export type EscopoModelo = "SISTEMA" | "INSTITUICAO" | "DEPARTAMENTO";

/** Dado mínimo de um modelo para decidir visibilidade/gestão. */
export interface ModeloEscopoRef {
  id: string;
  escopo: EscopoModelo;
  instituicaoId?: string | null;
  departamentoId?: string | null;
}

/** Contexto do usuário que consulta o catálogo. */
export interface ContextoEscopo {
  instituicaoId?: string | null;
  /** Departamento do usuário (quando houver). */
  departamentoId?: string | null;
  /** super-admin global vê todos os escopos. */
  isSuperAdmin?: boolean;
}

/**
 * Um modelo é visível quando:
 * - escopo `SISTEMA`: sempre (padrão geral);
 * - escopo `INSTITUICAO`: mesma instituição do usuário;
 * - escopo `DEPARTAMENTO`: mesmo DEPARTAMENTO do usuário.
 * Super-admin vê tudo.
 */
export function modeloVisivel(modelo: ModeloEscopoRef, ctx: ContextoEscopo): boolean {
  if (ctx.isSuperAdmin) return true;
  switch (modelo.escopo) {
    case "SISTEMA":
      return true;
    case "INSTITUICAO":
      return !!ctx.instituicaoId && modelo.instituicaoId === ctx.instituicaoId;
    case "DEPARTAMENTO":
      return !!ctx.departamentoId && modelo.departamentoId === ctx.departamentoId;
  }
}

/** Filtra os modelos visíveis para o contexto, preservando a ordem de entrada. */
export function modelosVisiveis<T extends ModeloEscopoRef>(modelos: T[], ctx: ContextoEscopo): T[] {
  return modelos.filter((m) => modeloVisivel(m, ctx));
}

export type PapelGestao =
  | "ADMIN_SISTEMA"
  | "GESTAO_INSTITUICAO"
  | "GESTAO_DEPARTAMENTO"
  | "COORDENADOR_AREA"
  | "PESQUISADOR"
  | "ANALISTA"
  | "ASSISTENTE";

/**
 * Capacidade de **gerir** (criar/editar/remover) modelos de um escopo, por papel.
 * A posse (mesma instituição/DEPARTAMENTO) é validada na API; aqui é só o papel.
 * - `ADMIN_SISTEMA`: qualquer escopo (super-admin).
 * - `GESTAO_INSTITUICAO`: escopo `INSTITUICAO` e `DEPARTAMENTO`.
 * - `GESTAO_DEPARTAMENTO`/`COORDENADOR_AREA`: escopo `DEPARTAMENTO`.
 * - demais: somente leitura.
 */
export function podeGerenciarEscopo(papel: PapelGestao, escopo: EscopoModelo): boolean {
  if (papel === "ADMIN_SISTEMA") return true;
  if (papel === "GESTAO_INSTITUICAO") return escopo === "INSTITUICAO" || escopo === "DEPARTAMENTO";
  if (papel === "GESTAO_DEPARTAMENTO" || papel === "COORDENADOR_AREA")
    return escopo === "DEPARTAMENTO";
  return false;
}

/** Aresta modelo → pré-requisito (o `modeloId` exige o `prerequisitoId`). */
export interface PrereqAresta {
  modeloId: string;
  prerequisitoId: string;
}

export interface ResultadoPrerequisitos {
  /** Conjunto completo a incluir (selecionados + todos os pré-requisitos transitivos). */
  todos: string[];
  /** Apenas os que NÃO estavam na seleção original (foram auto-adicionados). */
  adicionados: string[];
}

/**
 * Fechamento transitivo dos pré-requisitos de uma seleção de modelos.
 * Ex.: selecionar Produtividade traz Umidade automaticamente (auto-adiciona + avisa).
 * Seguro contra ciclos. Ordem de `todos`: seleção original primeiro, depois os
 * adicionados na ordem em que foram descobertos (determinística).
 */
export function resolverPrerequisitos(
  selecionados: string[],
  arestas: PrereqAresta[],
): ResultadoPrerequisitos {
  const porModelo = new Map<string, string[]>();
  for (const a of arestas) {
    const lista = porModelo.get(a.modeloId) ?? [];
    lista.push(a.prerequisitoId);
    porModelo.set(a.modeloId, lista);
  }

  const original = new Set(selecionados);
  const visitados = new Set<string>();
  const ordem: string[] = [];
  const fila = [...selecionados];

  while (fila.length) {
    const atual = fila.shift()!;
    if (visitados.has(atual)) continue;
    visitados.add(atual);
    ordem.push(atual);
    for (const prereq of porModelo.get(atual) ?? []) {
      if (!visitados.has(prereq)) fila.push(prereq);
    }
  }

  return {
    todos: ordem,
    adicionados: ordem.filter((id) => !original.has(id)),
  };
}

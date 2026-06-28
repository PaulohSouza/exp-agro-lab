import type { Ensaio, StatusExperimento } from "./types.js";

/**
 * Transições de status válidas por tipo de ensaio.
 * @see RN-FLUXO — comercial passa por aprovação CAD; interno não.
 */
const TRANSICOES: Record<Ensaio, Record<StatusExperimento, StatusExperimento[]>> = {
  comercial: {
    Inserindo: ["AprovadoCAD", "RecusadoCAD"],
    RecusadoCAD: ["Inserindo"],
    AprovadoCAD: ["EmConducao"],
    EmConducao: ["Concluido"],
    Concluido: [],
  },
  interno: {
    Inserindo: ["EmConducao"],
    AprovadoCAD: ["EmConducao"],
    RecusadoCAD: ["Inserindo"],
    EmConducao: ["Concluido"],
    Concluido: [],
  },
};

export function transicoesPermitidas(ensaio: Ensaio, atual: StatusExperimento): StatusExperimento[] {
  return TRANSICOES[ensaio][atual] ?? [];
}

export function podeTransicionar(
  ensaio: Ensaio,
  de: StatusExperimento,
  para: StatusExperimento,
): boolean {
  return transicoesPermitidas(ensaio, de).includes(para);
}

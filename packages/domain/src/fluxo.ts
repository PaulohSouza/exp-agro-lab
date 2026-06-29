import type { Ensaio, StatusExperimento } from "./types.js";

/**
 * Transições de status válidas por tipo de ensaio.
 * @see RN-FLUXO — COMERCIAL passa por aprovação CAD; INTERNO não.
 */
const TRANSICOES: Record<Ensaio, Record<StatusExperimento, StatusExperimento[]>> = {
  COMERCIAL: {
    INSERINDO: ["APROVADO_CAD", "RECUSADO_CAD"],
    RECUSADO_CAD: ["INSERINDO"],
    APROVADO_CAD: ["EM_CONDUCAO"],
    EM_CONDUCAO: ["CONCLUIDO"],
    CONCLUIDO: [],
  },
  INTERNO: {
    INSERINDO: ["EM_CONDUCAO"],
    APROVADO_CAD: ["EM_CONDUCAO"],
    RECUSADO_CAD: ["INSERINDO"],
    EM_CONDUCAO: ["CONCLUIDO"],
    CONCLUIDO: [],
  },
};

export function transicoesPermitidas(
  ensaio: Ensaio,
  atual: StatusExperimento,
): StatusExperimento[] {
  return TRANSICOES[ensaio][atual] ?? [];
}

export function podeTransicionar(
  ensaio: Ensaio,
  de: StatusExperimento,
  para: StatusExperimento,
): boolean {
  return transicoesPermitidas(ensaio, de).includes(para);
}

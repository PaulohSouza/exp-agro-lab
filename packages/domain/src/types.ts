/** Tipos centrais do domínio EXP-AGROLAB. */

export type Ensaio = "interno" | "comercial";

export type Delineamento = "DIC" | "DBC" | "FATORIAL";

export type StatusExperimento =
  | "Inserindo"
  | "AprovadoCAD"
  | "RecusadoCAD"
  | "EmConducao"
  | "Concluido";

export type NivelCompartilhamento = "input" | "edit";

/** Tratamento mínimo necessário para montar o croqui. */
export interface TratamentoRef {
  /** Identificador estável (uuid no banco). */
  id: string;
  /** Número de referência exibido (1 => T1). */
  numeroRef: number;
}

/** Uma parcela (célula do croqui). */
export interface Parcela {
  numero: number;
  bloco: number;
  tratamentoId: string;
  tratamentoNumeroRef: number;
  posLinha: number;
  posColuna: number;
  isInicio: boolean;
}

export interface Croqui {
  parcelas: Parcela[];
  numLinhas: number;
  numColunas: number;
  delineamento: Delineamento;
}

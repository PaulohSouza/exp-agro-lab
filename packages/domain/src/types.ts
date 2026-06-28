/** Tipos centrais do domínio EXP-AGROLAB. */

export type Ensaio = "interno" | "comercial";

export type Delineamento = "DIC" | "DBC" | "FATORIAL";

/**
 * Esquema de arranjo dos fatores (relevante quando há ≥2 fatores).
 * - `fatorial`: cada combinação é um tratamento, casualizado livremente no bloco.
 * - `parcela_subdividida` (split-plot): fator principal na parcela principal,
 *   subfator na subparcela, com casualização **restrita** e dois erros experimentais.
 */
export type Esquema = "fatorial" | "parcela_subdividida";

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

/**
 * Tratamento de um arranjo fatorial 2 fatores, anotado com os índices dos
 * níveis de cada fator — necessário para gerar/validar a parcela subdividida.
 */
export interface TratamentoFatorial extends TratamentoRef {
  /** Índice (0-based) do nível do **fator principal** (vai para a parcela principal). */
  nivelPrincipal: number;
  /** Índice (0-based) do nível do **subfator** (vai para a subparcela). */
  nivelSub: number;
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
  /**
   * Split-plot: id da **parcela principal** (whole-plot) a que a subparcela
   * pertence. As subparcelas de um mesmo `grupoPrincipal` formam um retângulo
   * contíguo e não podem ser separadas. Ausente no esquema fatorial.
   */
  grupoPrincipal?: number;
  /** Split-plot: índice (0-based) do nível do fator principal. */
  nivelPrincipal?: number;
  /** Split-plot: índice (0-based) do nível do subfator. */
  nivelSub?: number;
}

export interface Croqui {
  parcelas: Parcela[];
  numLinhas: number;
  numColunas: number;
  delineamento: Delineamento;
  /** Arranjo dos fatores; `parcela_subdividida` ativa as regras de integridade. */
  esquema?: Esquema;
}

/** Resultado de uma validação de integridade do croqui. */
export interface ResultadoValidacao {
  ok: boolean;
  /** Mensagens de erro (vazias quando `ok`). Úteis para o 422 da API. */
  erros: string[];
}

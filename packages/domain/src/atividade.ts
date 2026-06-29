/**
 * Atividades do experimento (Macro C). Regras puras da validação de apontamento.
 * O escopo (visibilidade/gestão) reaproveita `modeloVisivel`/`podeGerenciarEscopo`
 * de [[modeloAvaliacao]].
 * @see SDD/04-design-detalhado/08-catalogo-avaliacoes.md (Demanda C)
 */

export type TipoAtividade = "ACAO" | "APONTAMENTO";
export type TipoCampo = "NUMERO" | "TEXTO" | "DATA" | "BOOLEANO";

/** Definição de um campo parametrizado de uma atividade com apontamento. */
export interface CampoDef {
  rotulo: string;
  tipo: TipoCampo;
  isObrigatorio?: boolean;
}

/** Valor informado para um campo (apenas o slot do tipo do campo é usado). */
export interface ValorApontamento {
  rotulo: string;
  valorNum?: number | null;
  valorTexto?: string | null;
  valorData?: string | null; // ISO
  valorBool?: boolean | null;
}

/** Slot esperado por tipo de campo. */
const SLOT: Record<TipoCampo, keyof ValorApontamento> = {
  NUMERO: "valorNum",
  TEXTO: "valorTexto",
  DATA: "valorData",
  BOOLEANO: "valorBool",
};

function preenchido(v: ValorApontamento | undefined, tipo: TipoCampo): boolean {
  if (!v) return false;
  const val = v[SLOT[tipo]];
  if (val === undefined || val === null) return false;
  if (tipo === "TEXTO") return String(val).trim().length > 0;
  if (tipo === "NUMERO") return typeof val === "number" && !Number.isNaN(val);
  return true; // DATA (string ISO) ou BOOLEANO
}

/**
 * Valida os valores de um apontamento contra a definição de campos.
 * Retorna a lista de erros (vazia = ok):
 * - campo obrigatório não preenchido;
 * - valor preenchido no slot errado (tipo divergente);
 * - rótulo informado que não existe na definição.
 */
export function validarApontamento(campos: CampoDef[], valores: ValorApontamento[]): string[] {
  const erros: string[] = [];
  const porRotulo = new Map(valores.map((v) => [v.rotulo, v]));
  const rotulosDef = new Set(campos.map((c) => c.rotulo));

  for (const campo of campos) {
    const v = porRotulo.get(campo.rotulo);
    if (campo.isObrigatorio && !preenchido(v, campo.tipo)) {
      erros.push(`Campo obrigatório não preenchido: ${campo.rotulo}`);
      continue;
    }
    // se preencheu, o valor deve estar no slot do tipo do campo
    if (v) {
      const outroSlot = (["valorNum", "valorTexto", "valorData", "valorBool"] as const).some(
        (s) => s !== SLOT[campo.tipo] && v[s] !== undefined && v[s] !== null,
      );
      if (outroSlot && !preenchido(v, campo.tipo)) {
        erros.push(`Tipo divergente no campo: ${campo.rotulo} (esperado ${campo.tipo})`);
      }
    }
  }

  for (const v of valores) {
    if (!rotulosDef.has(v.rotulo)) erros.push(`Campo desconhecido: ${v.rotulo}`);
  }

  return erros;
}

/** Atividade de ação não tem apontamento; com apontamento exige campos. */
export function apontamentoEsperado(tipo: TipoAtividade): boolean {
  return tipo === "APONTAMENTO";
}

export type MarcoTipo = "IMPLANTACAO" | "INICIO" | "FIM" | "SEMEADURA" | "COLHEITA";
export type StatusMarco = "confirmado" | "pendente" | "atrasado";

/** Marcos padrão de um ensaio; semeadura/colheita só quando o objeto é cultura. */
export function marcosPadrao(isCultura: boolean): MarcoTipo[] {
  const base: MarcoTipo[] = ["IMPLANTACAO", "INICIO"];
  if (isCultura) base.push("SEMEADURA", "COLHEITA");
  base.push("FIM");
  return base;
}

/**
 * Status de um marco do cronograma. Datas em ISO (yyyy-mm-dd) — comparação
 * lexicográfica. `hojeISO` é injetado (domínio puro, sem relógio).
 */
export function statusMarco(input: {
  dataPrevista?: string | null;
  isConfirmada: boolean;
  hojeISO: string;
}): StatusMarco {
  if (input.isConfirmada) return "confirmado";
  if (input.dataPrevista && input.dataPrevista.slice(0, 10) < input.hojeISO) return "atrasado";
  return "pendente";
}

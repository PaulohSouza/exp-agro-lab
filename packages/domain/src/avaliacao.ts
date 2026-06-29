/**
 * Cálculo de unidade de saída das avaliações.
 * @see RN-CALC (genérico) e RN-PROD (produtividade kg/parcela → kg/ha)
 */

const M2_POR_HECTARE = 10_000;

/**
 * Área útil colhida da parcela.
 * RN-PROD: informada na colheita (linhas e comprimento) × espaçamento do cadastro.
 */
export function calcularAreaUtilColhida(input: {
  numLinhasColhidas: number;
  espacamentoLinhasM: number;
  comprimentoColhidoM: number;
}): number {
  const { numLinhasColhidas, espacamentoLinhasM, comprimentoColhidoM } = input;
  if (numLinhasColhidas <= 0 || espacamentoLinhasM <= 0 || comprimentoColhidoM <= 0) {
    throw new Error("Linhas, espaçamento e comprimento devem ser positivos.");
  }
  return numLinhasColhidas * espacamentoLinhasM * comprimentoColhidoM;
}

/** Produtividade em kg/ha a partir do peso colhido (kg) e da área útil (m²). */
export function calcularProdutividadeKgHa(input: {
  valorKgParcela: number;
  areaUtilM2: number;
}): number {
  if (input.areaUtilM2 <= 0) throw new Error("Área útil deve ser positiva.");
  return (input.valorKgParcela / input.areaUtilM2) * M2_POR_HECTARE;
}

/**
 * Cálculo genérico de unidade de saída (RN-CALC) via fórmula segura.
 * A fórmula é uma expressão aritmética com a variável `valor` e os `params`.
 * Ex.: "(valor / areaUtil) * 10000" com params { areaUtil: 9 }.
 */
export function calcularSaida(input: {
  valorColetado: number;
  formula: string;
  params?: Record<string, number>;
}): number {
  const escopo: Record<string, number> = {
    valor: input.valorColetado,
    ...(input.params ?? {}),
  };
  return avaliarExpressao(input.formula, escopo);
}

/**
 * Coleta em lote (Macro B): um lançamento de valor por (avaliação, parcela, amostra).
 */
export interface LancamentoLote {
  avaliacaoId: string;
  parcelaId: string;
  numAmostra?: number;
  valorColetado?: number | null;
}

/**
 * Deduplica lançamentos por (avaliação, parcela, amostra) — last-write-wins.
 * Usado na coleta em lote (a grade pode reenviar a mesma célula) e mantém o
 * upsert idempotente no servidor.
 */
export function dedupLancamentos(items: LancamentoLote[]): LancamentoLote[] {
  const m = new Map<string, LancamentoLote>();
  for (const it of items) m.set(`${it.avaliacaoId}|${it.parcelaId}|${it.numAmostra ?? 1}`, it);
  return [...m.values()];
}

/* ------------------------------------------------------------------ */
/* Avaliador de expressão seguro (shunting-yard) — sem eval.           */
/* Suporta: números, variáveis, + - * / , parênteses, unário -.        */
/* ------------------------------------------------------------------ */

type Token =
  | { t: "num"; v: number }
  | { t: "var"; v: string }
  | { t: "op"; v: string }
  | { t: "paren"; v: "(" | ")" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " " || ch === "\t") {
      i++;
      continue;
    }
    if (ch === "(" || ch === ")") {
      tokens.push({ t: "paren", v: ch });
      i++;
      continue;
    }
    if ("+-*/".includes(ch)) {
      tokens.push({ t: "op", v: ch });
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
      tokens.push({ t: "num", v: Number(num) });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let name = "";
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) name += expr[i++];
      tokens.push({ t: "var", v: name });
      continue;
    }
    throw new Error(`Caractere inválido na fórmula: '${ch}'`);
  }
  return tokens;
}

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function avaliarExpressao(expr: string, escopo: Record<string, number>): number {
  const tokens = tokenize(expr);
  const output: Token[] = [];
  const ops: Token[] = [];
  let prev: Token | null = null;

  for (const tk of tokens) {
    if (tk.t === "num" || tk.t === "var") {
      output.push(tk);
    } else if (tk.t === "op") {
      // operador unário '-' (início ou após operador/parêntese aberto)
      if (
        tk.v === "-" &&
        (prev === null || prev.t === "op" || (prev.t === "paren" && prev.v === "("))
      ) {
        output.push({ t: "num", v: 0 });
      }
      while (
        ops.length &&
        ops[ops.length - 1].t === "op" &&
        PREC[(ops[ops.length - 1] as { v: string }).v] >= PREC[tk.v]
      ) {
        output.push(ops.pop()!);
      }
      ops.push(tk);
    } else if (tk.v === "(") {
      ops.push(tk);
    } else {
      while (ops.length && !(ops[ops.length - 1].t === "paren")) output.push(ops.pop()!);
      if (!ops.length) throw new Error("Parênteses desbalanceados.");
      ops.pop(); // remove '('
    }
    prev = tk;
  }
  while (ops.length) {
    const op = ops.pop()!;
    if (op.t === "paren") throw new Error("Parênteses desbalanceados.");
    output.push(op);
  }

  const stack: number[] = [];
  for (const tk of output) {
    if (tk.t === "num") stack.push(tk.v);
    else if (tk.t === "var") {
      if (!(tk.v in escopo)) throw new Error(`Variável não fornecida: '${tk.v}'`);
      stack.push(escopo[tk.v]);
    } else if (tk.t === "op") {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error("Expressão inválida.");
      stack.push(aplicar(tk.v, a, b));
    }
  }
  if (stack.length !== 1) throw new Error("Expressão inválida.");
  return stack[0];
}

function aplicar(op: string, a: number, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      if (b === 0) throw new Error("Divisão por zero na fórmula.");
      return a / b;
    default:
      throw new Error(`Operador desconhecido: ${op}`);
  }
}

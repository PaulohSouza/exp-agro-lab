import { chiSqInv } from "./stats.js";

/**
 * Transformações de estabilização de variância (ROTA 2 do SAGRE): quando os
 * pressupostos da ANOVA falham, transforma-se a resposta, refaz-se a análise e
 * as médias são retro-transformadas para apresentação.
 * @see SDD/08-anexos/sagre-analytics.md
 */
export type Transformacao = "nenhuma" | "raiz" | "log" | "boxcox";

/** Observação ligada ao modelo (grupo = tratamento; bloco opcional em DBC). */
export interface ObservacaoModelo {
  grupo: string | number;
  bloco?: string | number;
  valor: number;
}

export interface TransformacaoAplicada {
  tipo: Transformacao;
  constante: number;
  /** λ estimado/usado no Box-Cox. */
  lambda?: number;
  valores: number[];
  /** rótulo legível, ex. "log(x+1)" ou "Box-Cox (λ=0,32)". */
  descricao: string;
}

export interface ResultadoBoxCox {
  lambda: number;
  logVerossimilhanca: number;
  /** IC 95% de λ (queda de 1,92 na log-verossimilhança ~ χ²₁/2). */
  intervalo95: [number, number];
  perfil: { lambda: number; logL: number }[];
}

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const media = (xs: number[]) => soma(xs) / xs.length;

/** Núcleo Box-Cox: (xᵏ−1)/λ, com o limite ln(x) em λ=0. */
function boxCox(x: number, lambda: number): number {
  return lambda === 0 ? Math.log(x) : (x ** lambda - 1) / lambda;
}

const rotuloConstante = (c: number) => (c === 0 ? "x" : `x+${c}`);

/** Aplica a transformação aos valores (λ é obrigatório para Box-Cox). */
export function aplicarTransformacao(
  valores: number[],
  tipo: Transformacao,
  opts: { constante?: number; lambda?: number } = {},
): TransformacaoAplicada {
  if (tipo === "nenhuma") {
    return { tipo, constante: 0, valores: [...valores], descricao: "nenhuma" };
  }
  if (tipo === "raiz") {
    const c = opts.constante ?? 0;
    if (valores.some((v) => v + c < 0)) {
      throw new Error("Raiz quadrada exige x + constante ≥ 0 (ajuste a constante).");
    }
    return {
      tipo,
      constante: c,
      valores: valores.map((v) => Math.sqrt(v + c)),
      descricao: `√(${rotuloConstante(c)})`,
    };
  }
  if (tipo === "log") {
    const c = opts.constante ?? 1; // log(y+1) por padrão (SAGRE)
    if (valores.some((v) => v + c <= 0)) {
      throw new Error("Logaritmo exige x + constante > 0 (ajuste a constante).");
    }
    return {
      tipo,
      constante: c,
      valores: valores.map((v) => Math.log(v + c)),
      descricao: `log(${rotuloConstante(c)})`,
    };
  }
  // boxcox
  const c = opts.constante ?? 0;
  if (opts.lambda == null) throw new Error("Box-Cox requer λ (estime com boxCoxLambda).");
  if (valores.some((v) => v + c <= 0)) {
    throw new Error("Box-Cox exige x + constante > 0 (ajuste a constante).");
  }
  const lambda = opts.lambda;
  return {
    tipo,
    constante: c,
    lambda,
    valores: valores.map((v) => boxCox(v + c, lambda)),
    descricao: `Box-Cox (λ=${lambda.toFixed(2)})`,
  };
}

/** Retro-transforma um valor (ex. média) para a escala original. */
export function retroTransformar(
  valor: number,
  tipo: Transformacao,
  opts: { constante?: number; lambda?: number } = {},
): number {
  switch (tipo) {
    case "nenhuma":
      return valor;
    case "raiz":
      return valor ** 2 - (opts.constante ?? 0);
    case "log":
      return Math.exp(valor) - (opts.constante ?? 1);
    case "boxcox": {
      const lambda = opts.lambda ?? 1;
      const c = opts.constante ?? 0;
      const base = lambda === 0 ? Math.exp(valor) : (lambda * valor + 1) ** (1 / lambda);
      return base - c;
    }
  }
}

/** SQ residual do modelo aditivo (grupo + bloco, se houver) sobre `z`. */
function rssAditivo(obs: ObservacaoModelo[], z: number[]): number {
  const g = media(z);
  const sqTotal = soma(z.map((v) => (v - g) ** 2));
  const porGrupo = new Map<string, number[]>();
  const porBloco = new Map<string, number[]>();
  const temBloco = obs.every((o) => o.bloco != null);
  obs.forEach((o, i) => {
    const kg = String(o.grupo);
    (porGrupo.get(kg) ?? porGrupo.set(kg, []).get(kg)!).push(z[i]);
    if (temBloco) {
      const kb = String(o.bloco);
      (porBloco.get(kb) ?? porBloco.set(kb, []).get(kb)!).push(z[i]);
    }
  });
  const sqEntre = (m: Map<string, number[]>) =>
    [...m.values()].reduce((a, vs) => a + vs.length * (media(vs) - g) ** 2, 0);
  return sqTotal - sqEntre(porGrupo) - (temBloco ? sqEntre(porBloco) : 0);
}

/**
 * Estima λ do Box-Cox por **verossimilhança perfilada** sobre o modelo aditivo
 * (grupo + bloco). L(λ) = −(n/2)·ln(RSS(λ)/n) + (λ−1)·Σ ln(xᵢ). Espelha
 * MASS::boxcox; busca em grade + refino parabólico.
 */
export function boxCoxLambda(
  obs: ObservacaoModelo[],
  opts: { min?: number; max?: number; passo?: number } = {},
): ResultadoBoxCox {
  const xs = obs.map((o) => o.valor);
  if (xs.some((v) => v <= 0)) {
    throw new Error("Box-Cox exige todos os valores > 0 (use uma constante na transformação).");
  }
  const n = xs.length;
  if (n < 3) throw new Error("Dados insuficientes para estimar λ.");
  const somaLog = soma(xs.map((x) => Math.log(x)));
  const min = opts.min ?? -2;
  const max = opts.max ?? 2;
  const passo = opts.passo ?? 0.05;

  const logL = (lambda: number) => {
    const z = xs.map((x) => boxCox(x, lambda));
    // piso evita ln(0)/NaN quando o modelo ajusta quase perfeitamente (RSS→0).
    const rss = Math.max(rssAditivo(obs, z), 1e-12);
    return -(n / 2) * Math.log(rss / n) + (lambda - 1) * somaLog;
  };

  const perfil: { lambda: number; logL: number }[] = [];
  for (let l = min; l <= max + 1e-9; l += passo) {
    const lambda = Math.round(l * 1e6) / 1e6; // evita ruído de ponto flutuante
    perfil.push({ lambda, logL: logL(lambda) });
  }
  let iMax = 0;
  for (let i = 1; i < perfil.length; i++) if (perfil[i].logL > perfil[iMax].logL) iMax = i;

  // refino parabólico com os vizinhos do máximo da grade
  let lambda = perfil[iMax].lambda;
  let maxLogL = perfil[iMax].logL;
  if (iMax > 0 && iMax < perfil.length - 1) {
    const a = perfil[iMax - 1];
    const b = perfil[iMax];
    const c = perfil[iMax + 1];
    const denom = a.logL - 2 * b.logL + c.logL;
    if (denom !== 0) {
      const desloc = (0.5 * (a.logL - c.logL)) / denom;
      lambda = b.lambda + desloc * passo;
      maxLogL = logL(lambda);
    }
  }

  // IC 95%: λ onde logL ≥ maxLogL − χ²(0.95,1)/2
  const corte = maxLogL - chiSqInv(0.95, 1) / 2;
  const acima = perfil.filter((p) => p.logL >= corte).map((p) => p.lambda);
  const intervalo95: [number, number] = acima.length
    ? [Math.min(...acima), Math.max(...acima)]
    : [lambda, lambda];

  return { lambda, logVerossimilhanca: maxLogL, intervalo95, perfil };
}

/**
 * Recomenda uma transformação a partir do λ de Box-Cox, mapeando para a
 * transformação padrão mais próxima (λ≈1 nenhuma, ≈0,5 raiz, ≈0 log).
 */
export function sugerirTransformacao(obs: ObservacaoModelo[]): {
  recomendada: Transformacao;
  lambda: number;
  justificativa: string;
} {
  const { lambda } = boxCoxLambda(obs);
  let recomendada: Transformacao;
  if (Math.abs(lambda - 1) <= 0.25) recomendada = "nenhuma";
  else if (Math.abs(lambda - 0.5) <= 0.25) recomendada = "raiz";
  else if (Math.abs(lambda) <= 0.25) recomendada = "log";
  else recomendada = "boxcox";
  return {
    recomendada,
    lambda,
    justificativa: `λ de Box-Cox ≈ ${lambda.toFixed(2)} → ${recomendada}.`,
  };
}

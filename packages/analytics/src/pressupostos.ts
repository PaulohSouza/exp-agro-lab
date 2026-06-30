import { chiSqSf, normCdf, normInv } from "./stats.js";
import { sugerirTransformacao, type ObservacaoModelo, type Transformacao } from "./transform.js";

function variancia(xs: number[]): number {
  const n = xs.length;
  const m = xs.reduce((a, b) => a + b, 0) / n;
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1);
}

/**
 * Teste de Bartlett para homogeneidade de variâncias.
 * Estatística ~ qui-quadrado(k-1).
 */
export function bartlett(grupos: number[][]): { estatistica: number; gl: number; p: number } {
  const k = grupos.length;
  const ni = grupos.map((g) => g.length);
  const vi = grupos.map((g) => variancia(g));
  const N = ni.reduce((a, b) => a + b, 0);
  const sp2 = grupos.reduce((acc, _, i) => acc + (ni[i] - 1) * vi[i], 0) / (N - k);
  const B =
    (N - k) * Math.log(sp2) - grupos.reduce((acc, _, i) => acc + (ni[i] - 1) * Math.log(vi[i]), 0);
  const C = 1 + (1 / (3 * (k - 1))) * (ni.reduce((acc, n) => acc + 1 / (n - 1), 0) - 1 / (N - k));
  const estatistica = B / C;
  const gl = k - 1;
  return { estatistica, gl, p: chiSqSf(estatistica, gl) };
}

const poly = (c: number[], x: number) => c.reduce((s, coef) => s * x + coef, 0);

/**
 * Teste de **Shapiro-Wilk** de normalidade (Royston, AS R94), 3 ≤ n ≤ 5000.
 * Devolve a estatística W e o p-valor (p alto ⇒ não rejeita a normalidade).
 */
export function shapiroWilk(x: number[]): { W: number; p: number } {
  const n = x.length;
  if (n < 3) throw new Error("Shapiro-Wilk exige n ≥ 3.");
  if (n > 5000) throw new Error("Shapiro-Wilk implementado para n ≤ 5000.");
  const xs = [...x].sort((a, b) => a - b);
  const media = xs.reduce((a, b) => a + b, 0) / n;
  const ss = xs.reduce((a, v) => a + (v - media) ** 2, 0);
  if (ss === 0) throw new Error("Variância nula: Shapiro-Wilk indefinido.");

  const nn2 = Math.floor(n / 2);
  // escores normais da metade inferior (negativos): s[i] = Φ⁻¹((i−0.375)/(n+0.25))
  const s = new Array(nn2 + 1).fill(0);
  let summ2 = 0;
  for (let i = 1; i <= nn2; i++) {
    s[i] = normInv((i - 0.375) / (n + 0.25));
    summ2 += s[i] * s[i];
  }
  summ2 *= 2;
  const ssumm2 = Math.sqrt(summ2);
  const rsn = 1 / Math.sqrt(n);
  const c1 = [-2.706056, 4.434685, -2.07119, -0.147981, 0.221157, 0];
  const c2 = [-3.582633, 5.682633, -1.752461, -0.293762, 0.042981, 0];

  // pesos a[] da metade superior (positivos, a[1] o maior)
  const a = new Array(nn2 + 1).fill(0);
  if (n === 3) {
    a[1] = Math.SQRT1_2;
  } else {
    const a1 = poly(c1, rsn) - s[1] / ssumm2;
    let fac: number;
    let i1: number;
    if (n > 5) {
      const a2 = poly(c2, rsn) - s[2] / ssumm2;
      fac = Math.sqrt((summ2 - 2 * s[1] ** 2 - 2 * s[2] ** 2) / (1 - 2 * a1 ** 2 - 2 * a2 ** 2));
      a[1] = a1;
      a[2] = a2;
      i1 = 3;
    } else {
      fac = Math.sqrt((summ2 - 2 * s[1] ** 2) / (1 - 2 * a1 ** 2));
      a[1] = a1;
      i1 = 2;
    }
    for (let i = i1; i <= nn2; i++) a[i] = -s[i] / fac;
  }

  // W = (Σ a[i]·(x₍n+1−i₎ − x₍i₎))² / Σ(xᵢ − x̄)²
  let num = 0;
  for (let i = 1; i <= nn2; i++) num += a[i] * (xs[n - i] - xs[i - 1]);
  const W = (num * num) / ss;

  // p-valor (Royston 1995)
  let p: number;
  if (n === 3) {
    const pi6 = 6 / Math.PI;
    p = pi6 * (Math.asin(Math.sqrt(W)) - Math.asin(Math.sqrt(0.75)));
  } else {
    let y: number;
    let mu: number;
    let sigma: number;
    if (n <= 11) {
      const gamma = -2.273 + 0.459 * n;
      const y0 = Math.log(1 - W);
      if (gamma - y0 <= 0) return { W, p: 0 };
      y = -Math.log(gamma - y0);
      mu = 0.544 - 0.39978 * n + 0.025054 * n ** 2 - 0.0006714 * n ** 3;
      sigma = Math.exp(1.3822 - 0.77857 * n + 0.062767 * n ** 2 - 0.0020322 * n ** 3);
    } else {
      const lnn = Math.log(n);
      y = Math.log(1 - W);
      mu = -1.5861 - 0.31082 * lnn - 0.083751 * lnn ** 2 + 0.0038915 * lnn ** 3;
      sigma = Math.exp(-0.4803 - 0.082676 * lnn + 0.0030302 * lnn ** 2);
    }
    p = 1 - normCdf((y - mu) / sigma);
  }
  return { W, p: Math.min(1, Math.max(0, p)) };
}

export interface RotaSugerida {
  normalidade: { W: number; p: number };
  homogeneidade: { estatistica: number; gl: number; p: number } | null;
  rota: "parametrica" | "transformacao" | "naoParametrico";
  transformacaoSugerida?: Transformacao;
  justificativa: string;
}

/** Resíduos do modelo aditivo (grupo[+bloco]) — base do teste de normalidade. */
function residuosAditivos(obs: ObservacaoModelo[]): number[] {
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const g = media(obs.map((o) => o.valor));
  const temBloco = obs.every((o) => o.bloco != null);
  const mediaPor = (chave: (o: ObservacaoModelo) => string) => {
    const m = new Map<string, number[]>();
    for (const o of obs) {
      const k = chave(o);
      (m.get(k) ?? m.set(k, []).get(k)!).push(o.valor);
    }
    return new Map([...m].map(([k, vs]) => [k, media(vs)]));
  };
  const mg = mediaPor((o) => String(o.grupo));
  const mb = temBloco ? mediaPor((o) => String(o.bloco)) : null;
  return obs.map(
    (o) => o.valor - mg.get(String(o.grupo))! - (mb ? mb.get(String(o.bloco))! - g : 0),
  );
}

/**
 * Recomenda a **rota de análise** a partir dos pressupostos: normalidade dos
 * resíduos (Shapiro-Wilk) + homogeneidade de variâncias (Bartlett). Se ambos
 * OK → ANOVA; senão tenta transformação (Box-Cox, dados positivos) e cai para
 * não-paramétrico quando nenhuma transformação padrão ajuda.
 */
export function sugerirRota(
  obs: ObservacaoModelo[],
  opcoes: { alpha?: number } = {},
): RotaSugerida {
  const alpha = opcoes.alpha ?? 0.05;
  const normalidade = shapiroWilk(residuosAditivos(obs));

  // Bartlett por grupo (precisa de ≥ 2 obs em cada grupo)
  const porGrupo = new Map<string, number[]>();
  for (const o of obs) {
    const k = String(o.grupo);
    (porGrupo.get(k) ?? porGrupo.set(k, []).get(k)!).push(o.valor);
  }
  const grupos = [...porGrupo.values()];
  const homogeneidade =
    grupos.length >= 2 && grupos.every((g) => g.length >= 2) ? bartlett(grupos) : null;

  const normalOk = normalidade.p >= alpha;
  const homogOk = homogeneidade ? homogeneidade.p >= alpha : true;

  if (normalOk && homogOk) {
    return {
      normalidade,
      homogeneidade,
      rota: "parametrica",
      justificativa: "Resíduos normais e variâncias homogêneas — ANOVA aplicável.",
    };
  }

  const positivos = obs.every((o) => o.valor > 0);
  if (positivos) {
    try {
      const sug = sugerirTransformacao(obs);
      if (sug.recomendada !== "nenhuma") {
        return {
          normalidade,
          homogeneidade,
          rota: "transformacao",
          transformacaoSugerida: sug.recomendada,
          justificativa: `Pressupostos violados; Box-Cox sugere ${sug.recomendada} (λ≈${sug.lambda.toFixed(2)}).`,
        };
      }
    } catch {
      // segue para não-paramétrico
    }
  }
  return {
    normalidade,
    homogeneidade,
    rota: "naoParametrico",
    justificativa: "Pressupostos violados e sem transformação padrão útil — usar não-paramétrico.",
  };
}

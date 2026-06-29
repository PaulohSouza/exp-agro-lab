/**
 * Distribuição da amplitude estudentizada (studentized range) — base do teste
 * de Tukey (HSD). `ptukey`/`qtukey` espelham as do R (referência do SAGRE),
 * via integração de Gauss-Legendre da formulação clássica.
 */
import { gammaln, normCdf } from "./stats.js";

/** Nós e pesos de Gauss-Legendre em [-1,1] (Newton sobre o polinômio de Legendre). */
const cacheGL = new Map<number, { x: number[]; w: number[] }>();
function gauleg(n: number): { x: number[]; w: number[] } {
  const cached = cacheGL.get(n);
  if (cached) return cached;
  const x = new Array(n).fill(0);
  const w = new Array(n).fill(0);
  const m = (n + 1) >> 1;
  for (let i = 0; i < m; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
    let z1 = 0,
      pp = 0;
    do {
      let p1 = 1,
        p2 = 0;
      for (let j = 0; j < n; j++) {
        const p3 = p2;
        p2 = p1;
        p1 = ((2 * j + 1) * z * p2 - j * p3) / (j + 1);
      }
      pp = (n * (z * p1 - p2)) / (z * z - 1);
      z1 = z;
      z = z1 - p1 / pp;
    } while (Math.abs(z - z1) > 1e-14);
    x[i] = -z;
    x[n - 1 - i] = z;
    w[i] = 2 / ((1 - z * z) * pp * pp);
    w[n - 1 - i] = w[i];
  }
  const r = { x, w };
  cacheGL.set(n, r);
  return r;
}

/** Integra f em [a,b] por Gauss-Legendre de n pontos. */
function integrar(f: (x: number) => number, a: number, b: number, n: number): number {
  const { x, w } = gauleg(n);
  const c1 = (b - a) / 2,
    c2 = (b + a) / 2;
  let s = 0;
  for (let i = 0; i < n; i++) s += w[i] * f(c1 * x[i] + c2);
  return c1 * s;
}

const phi = (u: number) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);

/**
 * P(amplitude de `cc` normais padrão ≤ w) =
 * cc ∫ φ(u) [Φ(u) − Φ(u − w)]^(cc−1) du.
 */
function wprob(w: number, cc: number): number {
  if (w <= 0) return 0;
  const integrando = (u: number) => phi(u) * Math.pow(normCdf(u) - normCdf(u - w), cc - 1);
  return cc * integrar(integrando, -8, 8, 128);
}

/**
 * CDF da amplitude estudentizada: P(Q ≤ q) com `cc` grupos e `df` g.l. do resíduo.
 * Integra wprob(q·s) sobre a densidade de s = sqrt(χ²_df / df).
 */
export function ptukey(q: number, cc: number, df: number): number {
  if (q <= 0) return 0;
  if (cc < 2) return 0;
  if (!isFinite(df) || df > 25000) return wprob(q, cc); // df → ∞: s ≡ 1
  const logC = Math.LN2 + (df / 2) * Math.log(df) - (df / 2) * Math.LN2 - gammaln(df / 2);
  const densS = (s: number) => Math.exp(logC + (df - 1) * Math.log(s) - (df * s * s) / 2);
  // intervalo adaptativo em torno de s≈1 (sd de s ≈ 1/sqrt(2·df))
  const spread = 10 / Math.sqrt(2 * df);
  const lo = Math.max(1e-9, 1 - spread);
  const hi = 1 + spread;
  return integrar((s) => densS(s) * wprob(q * s, cc), lo, hi, 128);
}

/** Quantil da amplitude estudentizada (q crítico do Tukey) por bissecção. */
export function qtukey(p: number, cc: number, df: number): number {
  let lo = 0,
    hi = 100;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (ptukey(mid, cc, df) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

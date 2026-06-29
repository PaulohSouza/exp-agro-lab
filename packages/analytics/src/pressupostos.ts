import { chiSqSf } from "./stats.js";

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

import { tInv, chiSqInv } from "./stats.js";
import { qtukey } from "./tukey.js";
import type { MediaTratamento } from "./types.js";

/**
 * Atribui letras a médias JÁ ORDENADAS (desc) dado um teste de significância
 * par-a-par `sig(i,j)`. Para diferenças baseadas em limiar sobre médias
 * ordenadas, a não-significância é intervalar (cobertura monotônica) — mesma
 * lógica usada pelo agricolae.
 */
function atribuirLetras(ord: MediaTratamento[], sig: (i: number, j: number) => boolean): MediaTratamento[] {
  const k = ord.length;
  const reach: number[] = [];
  for (let i = 0; i < k; i++) {
    let r = i;
    while (r + 1 < k && !sig(i, r + 1)) r++;
    reach[i] = r;
  }
  const colunas: { start: number; end: number }[] = [];
  for (let i = 0; i < k; i++) {
    if (i === 0 || reach[i] > reach[i - 1]) colunas.push({ start: i, end: reach[i] });
  }
  const letra = (idx: number) => String.fromCharCode(97 + idx);
  return ord.map((m, i) => {
    let s = "";
    colunas.forEach((c, ci) => {
      if (i >= c.start && i <= c.end) s += letra(ci);
    });
    return { ...m, letra: s };
  });
}

/** Comparação de médias por LSD de Fisher (DMS), com atribuição de letras. */
export function compararMediasLSD(
  medias: MediaTratamento[],
  qmResiduo: number,
  glResiduo: number,
  alpha = 0.05,
): MediaTratamento[] {
  const ord = [...medias].sort((a, b) => b.media - a.media);
  if (ord.length === 0) return [];
  const t = tInv(1 - alpha / 2, glResiduo);
  const sig = (i: number, j: number) =>
    Math.abs(ord[i].media - ord[j].media) > t * Math.sqrt(qmResiduo * (1 / ord[i].n + 1 / ord[j].n));
  return atribuirLetras(ord, sig);
}

/**
 * Comparação de médias por **Tukey (HSD)** — Tukey-Kramer para n desigual.
 * DMS(i,j) = q(1−α; k, glRes) · √(QMres/2 · (1/nᵢ + 1/nⱼ)). É o padrão do SAGRE.
 */
export function compararMediasTukey(
  medias: MediaTratamento[],
  qmResiduo: number,
  glResiduo: number,
  alpha = 0.05,
): MediaTratamento[] {
  const ord = [...medias].sort((a, b) => b.media - a.media);
  const k = ord.length;
  if (k === 0) return [];
  const qcrit = qtukey(1 - alpha, k, glResiduo);
  const sig = (i: number, j: number) =>
    Math.abs(ord[i].media - ord[j].media) > qcrit * Math.sqrt((qmResiduo / 2) * (1 / ord[i].n + 1 / ord[j].n));
  return atribuirLetras(ord, sig);
}

/**
 * Agrupamento de **Scott-Knott** (Scott & Knott, 1974): particiona
 * recursivamente as médias ordenadas no corte de maior soma de quadrados entre
 * grupos, testando λ ~ χ² com ν = k/(π−2). Gera grupos disjuntos (uma letra
 * cada), sem ambiguidade de sobreposição.
 */
export function compararMediasScottKnott(
  medias: MediaTratamento[],
  qmResiduo: number,
  glResiduo: number,
  alpha = 0.05,
): MediaTratamento[] {
  const ord = [...medias].sort((a, b) => b.media - a.media);
  const k = ord.length;
  if (k === 0) return [];
  if (k === 1) return [{ ...ord[0], letra: "a" }];

  const r = ord.reduce((a, m) => a + m.n, 0) / k; // repetições (balanceado)
  const varMedia = qmResiduo / r; // variância de uma média
  const residual = glResiduo * varMedia; // parcela do resíduo em σ̂₀²

  const grupo = new Array(k).fill(0);
  let proximoGrupo = 0;

  const juntar = (ini: number, fim: number) => {
    for (let i = ini; i <= fim; i++) grupo[i] = proximoGrupo;
    proximoGrupo++;
  };

  // Teste do grupo [ini,fim]: σ̂₀², B0 e ν₀ recalculados para o subgrupo atual.
  const dividir = (ini: number, fim: number) => {
    const g = fim - ini + 1;
    if (g === 1) return juntar(ini, fim);

    const fatias = ord.slice(ini, fim + 1);
    const T = fatias.reduce((a, m) => a + m.media, 0);
    const mediaGrupo = T / g;
    const sqGrupo = fatias.reduce((a, m) => a + (m.media - mediaGrupo) ** 2, 0);
    const sigma0sq = (sqGrupo + residual) / (g + glResiduo);
    if (sigma0sq <= 0) return juntar(ini, fim);

    // melhor corte: maximiza B0 = T1²/k1 + T2²/k2 − T²/g
    let B0 = -Infinity, corte = ini, T1 = 0;
    for (let p = ini; p < fim; p++) {
      T1 += ord[p].media;
      const k1 = p - ini + 1, k2 = g - k1, T2 = T - T1;
      const B = (T1 * T1) / k1 + (T2 * T2) / k2 - (T * T) / g;
      if (B > B0) { B0 = B; corte = p; }
    }

    const lambda = (Math.PI / (2 * (Math.PI - 2))) * (B0 / sigma0sq);
    const critico = chiSqInv(1 - alpha, g / (Math.PI - 2));
    if (lambda >= critico) {
      dividir(ini, corte);
      dividir(corte + 1, fim);
    } else {
      juntar(ini, fim);
    }
  };
  dividir(0, k - 1);

  // grupos são contíguos em ordem decrescente → letras a, b, c…
  return ord.map((m, i) => ({ ...m, letra: String.fromCharCode(97 + grupo[i]) }));
}

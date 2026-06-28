import { tInv } from "./stats.js";
import type { MediaTratamento } from "./types.js";

/**
 * Comparação de médias por LSD de Fisher (DMS), com atribuição de letras.
 * Para médias ordenadas, a não-significância é "intervalar" (monotônica),
 * o que dá letras corretas por cobertura de intervalos.
 */
export function compararMediasLSD(
  medias: MediaTratamento[],
  qmResiduo: number,
  glResiduo: number,
  alpha = 0.05,
): MediaTratamento[] {
  const ord = [...medias].sort((a, b) => b.media - a.media);
  const k = ord.length;
  if (k === 0) return [];
  const t = tInv(1 - alpha / 2, glResiduo);

  const sig = (i: number, j: number) =>
    Math.abs(ord[i].media - ord[j].media) > t * Math.sqrt(qmResiduo * (1 / ord[i].n + 1 / ord[j].n));

  // reach[i] = índice mais distante (>= i) ainda NÃO significativo a partir de i
  const reach: number[] = [];
  for (let i = 0; i < k; i++) {
    let r = i;
    while (r + 1 < k && !sig(i, r + 1)) r++;
    reach[i] = r;
  }

  // colunas de letras: nova coluna quando reach aumenta
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

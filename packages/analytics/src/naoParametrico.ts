import { chiSqSf, normCdf } from "./stats.js";
import { qtukey } from "./tukey.js";

/**
 * Testes não-paramétricos (ROTA 3 do SAGRE): alternativas à ANOVA quando os
 * pressupostos não são corrigíveis por transformação. Kruskal-Wallis (1 fator,
 * tipo DIC) e Friedman (em blocos, tipo DBC), com post-hoc e letras.
 * @see SDD/08-anexos/sagre-analytics.md
 */
export interface ObservacaoNP {
  grupo: string | number;
  bloco?: string | number;
  valor: number;
}

export interface RankGrupo {
  grupo: string;
  somaRanks: number;
  mediaRank: number;
  n: number;
  letra?: string;
}

export interface ComparacaoDunn {
  a: string;
  b: string;
  z: number;
  p: number;
  pAjustado: number;
  significativo: boolean;
}

export interface ResultadoKruskal {
  metodo: "Kruskal-Wallis";
  H: number;
  gl: number;
  p: number;
  significativo: boolean;
  /** fator de correção de empates (1 = sem empates). */
  correcaoEmpates: number;
  grupos: RankGrupo[];
  postHoc: { metodo: "Dunn"; ajuste: "Bonferroni"; comparacoes: ComparacaoDunn[] };
}

export interface ComparacaoNemenyi {
  a: string;
  b: string;
  diferenca: number;
  significativo: boolean;
}

export interface ResultadoFriedman {
  metodo: "Friedman";
  qui2: number;
  gl: number;
  p: number;
  significativo: boolean;
  blocos: number;
  tratamentos: number;
  correcaoEmpates: number;
  grupos: RankGrupo[];
  postHoc: { metodo: "Nemenyi"; cd: number; comparacoes: ComparacaoNemenyi[] };
}

/** Ranqueia com média nos empates; devolve Σ(t³−t) das amarrações. */
function rankear(valores: number[]): { ranks: number[]; somaT: number } {
  const ordem = valores.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(valores.length).fill(0);
  let somaT = 0;
  let i = 0;
  while (i < ordem.length) {
    let j = i;
    while (j + 1 < ordem.length && ordem[j + 1][0] === ordem[i][0]) j++;
    const rankMedio = (i + j) / 2 + 1; // posições 0-based i..j → ranks i+1..j+1
    for (let r = i; r <= j; r++) ranks[ordem[r][1]] = rankMedio;
    const t = j - i + 1;
    if (t > 1) somaT += t ** 3 - t;
    i = j + 1;
  }
  return { ranks, somaT };
}

/** Letras a partir de médias ORDENADAS (desc) e um teste par-a-par `sig(i,j)`. */
function atribuirLetras(n: number, sig: (i: number, j: number) => boolean): string[] {
  const reach: number[] = [];
  for (let i = 0; i < n; i++) {
    let r = i;
    while (r + 1 < n && !sig(i, r + 1)) r++;
    reach[i] = r;
  }
  const colunas: { start: number; end: number }[] = [];
  for (let i = 0; i < n; i++) {
    if (i === 0 || reach[i] > reach[i - 1]) colunas.push({ start: i, end: reach[i] });
  }
  const letra = (idx: number) => String.fromCharCode(97 + idx);
  return Array.from({ length: n }, (_, i) => {
    let s = "";
    colunas.forEach((c, ci) => {
      if (i >= c.start && i <= c.end) s += letra(ci);
    });
    return s;
  });
}

/** Anexa letras aos grupos (ordena por média de rank desc; aplica `sigPar`). */
function comLetras(info: RankGrupo[], sigPar: (a: string, b: string) => boolean): RankGrupo[] {
  const ord = [...info].sort((a, b) => b.mediaRank - a.mediaRank);
  const letras = atribuirLetras(ord.length, (i, j) => sigPar(ord[i].grupo, ord[j].grupo));
  const letraDe = new Map(ord.map((g, i) => [g.grupo, letras[i]]));
  return info.map((g) => ({ ...g, letra: letraDe.get(g.grupo) }));
}

/**
 * **Kruskal-Wallis** (1 fator, DIC): H ~ χ²(k−1) com correção de empates.
 * Post-hoc de **Dunn** (z par-a-par com ajuste de Bonferroni).
 */
export function kruskalWallis(
  obs: ObservacaoNP[],
  opcoes: { alpha?: number } = {},
): ResultadoKruskal {
  const alpha = opcoes.alpha ?? 0.05;
  const N = obs.length;
  if (N < 3) throw new Error("Dados insuficientes para Kruskal-Wallis.");
  const nomes = [...new Set(obs.map((o) => String(o.grupo)))];
  const k = nomes.length;
  if (k < 2) throw new Error("Kruskal-Wallis exige ao menos 2 grupos.");

  const { ranks, somaT } = rankear(obs.map((o) => o.valor));
  const porGrupo = new Map<string, number[]>();
  obs.forEach((o, i) => {
    const g = String(o.grupo);
    (porGrupo.get(g) ?? porGrupo.set(g, []).get(g)!).push(ranks[i]);
  });
  const info: RankGrupo[] = nomes.map((g) => {
    const rs = porGrupo.get(g)!;
    const R = rs.reduce((a, b) => a + b, 0);
    return { grupo: g, somaRanks: R, mediaRank: R / rs.length, n: rs.length };
  });

  const somaR2n = info.reduce((acc, g) => acc + g.somaRanks ** 2 / g.n, 0);
  let H = (12 / (N * (N + 1))) * somaR2n - 3 * (N + 1);
  const C = 1 - somaT / (N ** 3 - N);
  if (C > 0) H = H / C;
  const gl = k - 1;
  const p = chiSqSf(H, gl);

  // Dunn: σ² = N(N+1)/12 − ΣT/(12(N−1)); z = ΔR̄ / √(σ²(1/nᵢ+1/nⱼ))
  const sigma2 = (N * (N + 1)) / 12 - somaT / (12 * (N - 1));
  const m = (k * (k - 1)) / 2;
  const comparacoes: ComparacaoDunn[] = [];
  for (let a = 0; a < k; a++) {
    for (let b = a + 1; b < k; b++) {
      const z =
        (info[a].mediaRank - info[b].mediaRank) /
        Math.sqrt(sigma2 * (1 / info[a].n + 1 / info[b].n));
      const pv = 2 * (1 - normCdf(Math.abs(z)));
      const pAjustado = Math.min(1, pv * m);
      comparacoes.push({
        a: info[a].grupo,
        b: info[b].grupo,
        z,
        p: pv,
        pAjustado,
        significativo: pAjustado < alpha,
      });
    }
  }
  const sigPar = (gi: string, gj: string) =>
    comparacoes.find((c) => (c.a === gi && c.b === gj) || (c.a === gj && c.b === gi))!
      .significativo;

  return {
    metodo: "Kruskal-Wallis",
    H,
    gl,
    p,
    significativo: p < alpha,
    correcaoEmpates: C,
    grupos: comLetras(info, sigPar),
    postHoc: { metodo: "Dunn", ajuste: "Bonferroni", comparacoes },
  };
}

/**
 * **Friedman** (em blocos, DBC): ranqueia DENTRO de cada bloco; estatística
 * ~ χ²(k−1) com correção de empates. Post-hoc de **Nemenyi** (diferença
 * crítica via amplitude estudentizada). Exige dados completos (b × k).
 */
export function friedman(obs: ObservacaoNP[], opcoes: { alpha?: number } = {}): ResultadoFriedman {
  const alpha = opcoes.alpha ?? 0.05;
  const blocos = [...new Set(obs.map((o) => String(o.bloco)))];
  const trats = [...new Set(obs.map((o) => String(o.grupo)))];
  const b = blocos.length;
  const k = trats.length;
  if (b < 2 || k < 2) throw new Error("Friedman exige ao menos 2 blocos e 2 tratamentos.");
  if (obs.length !== b * k) {
    throw new Error(
      "Friedman exige dados completos (uma observação por tratamento em cada bloco).",
    );
  }

  const somaRank = new Map<string, number>(trats.map((t) => [t, 0]));
  let somaT = 0;
  for (const bl of blocos) {
    const linha = obs.filter((o) => String(o.bloco) === bl);
    if (linha.length !== k) throw new Error("Friedman exige dados completos (b × k).");
    const { ranks, somaT: st } = rankear(linha.map((o) => o.valor));
    somaT += st;
    linha.forEach((o, i) => {
      const g = String(o.grupo);
      somaRank.set(g, somaRank.get(g)! + ranks[i]);
    });
  }

  const somaR2 = [...somaRank.values()].reduce((a, R) => a + R * R, 0);
  let qui2 = (12 / (b * k * (k + 1))) * somaR2 - 3 * b * (k + 1);
  const corr = 1 - somaT / (b * (k ** 3 - k));
  if (corr > 0) qui2 = qui2 / corr;
  const gl = k - 1;
  const p = chiSqSf(qui2, gl);

  const info: RankGrupo[] = trats.map((t) => {
    const R = somaRank.get(t)!;
    return { grupo: t, somaRanks: R, mediaRank: R / b, n: b };
  });

  // Nemenyi: CD = q(α; k, ∞)/√2 · √(k(k+1)/(6b)); compara médias de rank.
  const q = qtukey(1 - alpha, k, 1e6);
  const cd = (q / Math.SQRT2) * Math.sqrt((k * (k + 1)) / (6 * b));
  const comparacoes: ComparacaoNemenyi[] = [];
  for (let a = 0; a < k; a++) {
    for (let j = a + 1; j < k; j++) {
      const diferenca = Math.abs(info[a].mediaRank - info[j].mediaRank);
      comparacoes.push({
        a: info[a].grupo,
        b: info[j].grupo,
        diferenca,
        significativo: diferenca > cd,
      });
    }
  }
  const sigPar = (gi: string, gj: string) =>
    comparacoes.find((c) => (c.a === gi && c.b === gj) || (c.a === gj && c.b === gi))!
      .significativo;

  return {
    metodo: "Friedman",
    qui2,
    gl,
    p,
    significativo: p < alpha,
    blocos: b,
    tratamentos: k,
    correcaoEmpates: corr,
    grupos: comLetras(info, sigPar),
    postHoc: { metodo: "Nemenyi", cd, comparacoes },
  };
}

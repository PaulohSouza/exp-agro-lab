import { fSf } from "./stats.js";
import { compararMediasLSD, compararMediasTukey, compararMediasScottKnott } from "./comparacao.js";
import type { MetodoComparacao, MediaTratamento } from "./types.js";

/**
 * Análise **conjunta** (multi-local / multi-ambiente) de experimentos em DBC com
 * os mesmos tratamentos. Modelo: Local + Bloco/Local + Tratamento + Local×Trat
 * + Erro. Locais aleatórios ⇒ Tratamento é testado pela interação Local×Trat
 * (G×A). Reporta a razão entre os QM-resíduo por local (regra de Cochran ~7×
 * para decidir se vale juntar). @see SDD/08-anexos/sagre-analytics.md
 */
export interface ObservacaoConjunta {
  local: string | number;
  bloco: string | number;
  tratamento: string | number;
  valor: number;
}

export interface LinhaAnovaConjunta {
  fonte: string;
  gl: number;
  sq: number;
  qm?: number;
  f?: number;
  p?: number;
}

export interface ResultadoConjunta {
  metodo: "Conjunta";
  locais: number;
  blocos: number;
  tratamentos: number;
  tabela: LinhaAnovaConjunta[];
  mediaGeral: number;
  cv: number;
  glResiduo: number;
  qmResiduo: number;
  fLocal: { f: number; p: number; significativo: boolean };
  fTratamento: { f: number; p: number; significativo: boolean };
  fInteracao: { f: number; p: number; significativo: boolean };
  /** razão entre o maior e o menor QM-resíduo por local (homogêneo se < 7). */
  razaoQMResiduo: number;
  homogeneo: boolean;
  medias: MediaTratamento[];
  comparacao: { metodo: string; alpha: number };
}

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const media = (xs: number[]) => soma(xs) / xs.length;
const desvio2 = (vs: number[], ref: number) => vs.length * (media(vs) - ref) ** 2;

function agrupar<T>(itens: T[], chave: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of itens) {
    const k = chave(it);
    (m.get(k) ?? m.set(k, []).get(k)!).push(it);
  }
  return m;
}

export function anovaConjunta(
  observacoes: ObservacaoConjunta[],
  opcoes: { metodo?: MetodoComparacao; alpha?: number } = {},
): ResultadoConjunta {
  const alpha = opcoes.alpha ?? 0.05;
  const metodo = opcoes.metodo ?? "Tukey";
  const N = observacoes.length;
  if (N < 8) throw new Error("Dados insuficientes para análise conjunta.");

  const locais = [...new Set(observacoes.map((o) => String(o.local)))];
  const blocos = [...new Set(observacoes.map((o) => String(o.bloco)))];
  const trats = [...new Set(observacoes.map((o) => String(o.tratamento)))];
  const L = locais.length;
  const b = blocos.length;
  const t = trats.length;
  if (L < 2) throw new Error("Análise conjunta exige ao menos 2 locais.");
  if (t < 2) throw new Error("Análise conjunta exige ao menos 2 tratamentos.");
  if (b < 2) throw new Error("Análise conjunta (DBC) exige ao menos 2 blocos.");
  if (N !== L * b * t) {
    throw new Error("Análise conjunta exige dados balanceados (L × b × t, sem faltas).");
  }

  const valores = observacoes.map((o) => o.valor);
  const g = media(valores);
  const sqTotal = soma(valores.map((v) => (v - g) ** 2));

  const porLocal = agrupar(observacoes, (o) => String(o.local));
  const porTrat = agrupar(observacoes, (o) => String(o.tratamento));
  const porLocalBloco = agrupar(observacoes, (o) => `${o.local}|${o.bloco}`);
  const porLocalTrat = agrupar(observacoes, (o) => `${o.local}|${o.tratamento}`);
  const val = (xs: ObservacaoConjunta[]) => xs.map((o) => o.valor);

  const sqLocal = soma([...porLocal.values()].map((vs) => desvio2(val(vs), g)));
  const sqTrat = soma([...porTrat.values()].map((vs) => desvio2(val(vs), g)));
  // Bloco dentro de Local: desvio da média do bloco-no-local vs média do local
  const sqBlocoLocal = soma(
    [...porLocalBloco.values()].map((vs) => {
      const mLocal = media(val(porLocal.get(String(vs[0].local))!));
      return desvio2(val(vs), mLocal);
    }),
  );
  // Local × Tratamento: célula − local − trat + geral
  const sqLxT = soma(
    [...porLocalTrat.values()].map((vs) => {
      const mLocal = media(val(porLocal.get(String(vs[0].local))!));
      const mTrat = media(val(porTrat.get(String(vs[0].tratamento))!));
      return vs.length * (media(val(vs)) - mLocal - mTrat + g) ** 2;
    }),
  );
  const sqResiduo = sqTotal - sqLocal - sqBlocoLocal - sqTrat - sqLxT;

  const glLocal = L - 1;
  const glBlocoLocal = L * (b - 1);
  const glTrat = t - 1;
  const glLxT = (L - 1) * (t - 1);
  const glResiduo = L * (t - 1) * (b - 1);

  const qmLocal = sqLocal / glLocal;
  const qmBlocoLocal = sqBlocoLocal / glBlocoLocal;
  const qmTrat = sqTrat / glTrat;
  const qmLxT = sqLxT / glLxT;
  const qmResiduo = sqResiduo / glResiduo;

  // Locais aleatórios: Local testado pelo Bloco/Local; Tratamento pela interação;
  // interação pelo resíduo.
  const fLocal = qmLocal / qmBlocoLocal;
  const fTrat = qmTrat / qmLxT;
  const fLxT = qmLxT / qmResiduo;
  const pLocal = fSf(fLocal, glLocal, glBlocoLocal);
  const pTrat = fSf(fTrat, glTrat, glLxT);
  const pLxT = fSf(fLxT, glLxT, glResiduo);

  const tabela: LinhaAnovaConjunta[] = [
    { fonte: "Local", gl: glLocal, sq: sqLocal, qm: qmLocal, f: fLocal, p: pLocal },
    { fonte: "Bloco/Local", gl: glBlocoLocal, sq: sqBlocoLocal, qm: qmBlocoLocal },
    { fonte: "Tratamento", gl: glTrat, sq: sqTrat, qm: qmTrat, f: fTrat, p: pTrat },
    { fonte: "Local × Tratamento", gl: glLxT, sq: sqLxT, qm: qmLxT, f: fLxT, p: pLxT },
    { fonte: "Resíduo", gl: glResiduo, sq: sqResiduo, qm: qmResiduo },
    { fonte: "Total", gl: N - 1, sq: sqTotal },
  ];

  // QM-resíduo por local (DBC de cada local) → razão máx/mín (homogeneidade)
  const qmResLocais = locais.map((lc) => {
    const obsL = porLocal.get(lc)!;
    const gL = media(val(obsL));
    const sqTotL = soma(val(obsL).map((v) => (v - gL) ** 2));
    const sqBlocoL = soma(
      [...agrupar(obsL, (o) => String(o.bloco)).values()].map((vs) => desvio2(val(vs), gL)),
    );
    const sqTratL = soma(
      [...agrupar(obsL, (o) => String(o.tratamento)).values()].map((vs) => desvio2(val(vs), gL)),
    );
    const sqResL = sqTotL - sqBlocoL - sqTratL;
    return sqResL / ((t - 1) * (b - 1));
  });
  const positivos = qmResLocais.filter((q) => q > 0);
  const razaoQMResiduo = positivos.length ? Math.max(...positivos) / Math.min(...positivos) : 1;

  // médias de tratamento (geral) comparadas usando o erro da interação (G×A)
  const mediasBrutas: MediaTratamento[] = trats.map((tr) => {
    const vs = val(porTrat.get(tr)!);
    return { tratamento: tr, media: media(vs), n: vs.length };
  });
  const comparar =
    metodo === "LSD"
      ? compararMediasLSD
      : metodo === "ScottKnott"
        ? compararMediasScottKnott
        : compararMediasTukey;
  const medias = comparar(mediasBrutas, qmLxT, glLxT, alpha);

  return {
    metodo: "Conjunta",
    locais: L,
    blocos: b,
    tratamentos: t,
    tabela,
    mediaGeral: g,
    cv: (Math.sqrt(qmResiduo) / g) * 100,
    glResiduo,
    qmResiduo,
    fLocal: { f: fLocal, p: pLocal, significativo: pLocal < alpha },
    fTratamento: { f: fTrat, p: pTrat, significativo: pTrat < alpha },
    fInteracao: { f: fLxT, p: pLxT, significativo: pLxT < alpha },
    razaoQMResiduo,
    homogeneo: razaoQMResiduo < 7,
    medias,
    comparacao: { metodo, alpha },
  };
}

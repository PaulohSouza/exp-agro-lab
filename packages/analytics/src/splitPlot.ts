import { fSf } from "./stats.js";

/** Observação de um experimento em parcela subdividida (split-plot) em DBC. */
export interface ObservacaoSplit {
  bloco: string | number;
  /** nível do fator principal (parcela). */
  fatorA: string | number;
  /** nível do subfator (subparcela). */
  fatorB: string | number;
  valor: number;
}

export interface LinhaAnova {
  fonte: string;
  gl: number;
  sq: number;
  qm?: number;
  f?: number;
  p?: number;
}

export interface MediaNivel {
  nivel: string;
  media: number;
  n: number;
}

export interface ResultadoAnovaSplit {
  esquema: "PARCELA_SUBDIVIDIDA";
  tabela: LinhaAnova[];
  mediaGeral: number;
  /** CV da parcela principal (Erro a) e da subparcela (Erro b). */
  cvParcela: number;
  cvSubparcela: number;
  fatorA: { f: number; p: number; significativo: boolean };
  fatorB: { f: number; p: number; significativo: boolean };
  interacao: { f: number; p: number; significativo: boolean };
  mediasA: MediaNivel[];
  mediasB: MediaNivel[];
}

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const media = (xs: number[]) => soma(xs) / xs.length;

function chaves<T>(itens: T[], chave: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of itens) {
    const k = chave(it);
    (m.get(k) ?? m.set(k, []).get(k)!).push(it);
  }
  return m;
}
const desvio2 = (vs: number[], g: number) => vs.length * (media(vs) - g) ** 2;

/**
 * ANOVA de **parcela subdividida (split-plot)** em DBC, balanceado.
 * Dois erros experimentais: Erro(a)=Bloco×A testa o fator principal; Erro(b)
 * testa o subfator e a interação A×B. @see SDD/04-design-detalhado/06-croqui-esquemas.md §5
 */
export function anovaSplitPlot(
  observacoes: ObservacaoSplit[],
  opcoes: { alpha?: number } = {},
): ResultadoAnovaSplit {
  const alpha = opcoes.alpha ?? 0.05;
  const valores = observacoes.map((o) => o.valor);
  const N = valores.length;
  if (N < 4) throw new Error("Dados insuficientes para ANOVA split-plot.");

  const blocos = [...new Set(observacoes.map((o) => String(o.bloco)))];
  const niveisA = [...new Set(observacoes.map((o) => String(o.fatorA)))];
  const niveisB = [...new Set(observacoes.map((o) => String(o.fatorB)))];
  const r = blocos.length;
  const a = niveisA.length;
  const b = niveisB.length;
  if (a < 2 || b < 2) throw new Error("Split-plot exige ao menos 2 níveis em cada fator.");
  if (r < 2) throw new Error("Split-plot (DBC) exige ao menos 2 blocos.");
  if (N !== r * a * b) {
    throw new Error("Split-plot exige dados balanceados (r × a × b observações, sem faltas).");
  }

  const g = media(valores);
  const sqTotal = soma(valores.map((v) => (v - g) ** 2));

  const porBloco = chaves(observacoes, (o) => String(o.bloco));
  const porA = chaves(observacoes, (o) => String(o.fatorA));
  const porB = chaves(observacoes, (o) => String(o.fatorB));
  const porBlocoA = chaves(observacoes, (o) => `${o.bloco}|${o.fatorA}`);
  const porAB = chaves(observacoes, (o) => `${o.fatorA}|${o.fatorB}`);

  const sqBloco = soma(
    [...porBloco.values()].map((vs) =>
      desvio2(
        vs.map((o) => o.valor),
        g,
      ),
    ),
  );
  const sqA = soma(
    [...porA.values()].map((vs) =>
      desvio2(
        vs.map((o) => o.valor),
        g,
      ),
    ),
  );
  const sqParcela = soma(
    [...porBlocoA.values()].map((vs) =>
      desvio2(
        vs.map((o) => o.valor),
        g,
      ),
    ),
  );
  const sqErroA = sqParcela - sqBloco - sqA;
  const sqB = soma(
    [...porB.values()].map((vs) =>
      desvio2(
        vs.map((o) => o.valor),
        g,
      ),
    ),
  );
  const sqAB =
    soma(
      [...porAB.values()].map((vs) =>
        desvio2(
          vs.map((o) => o.valor),
          g,
        ),
      ),
    ) -
    sqA -
    sqB;
  const sqErroB = sqTotal - sqBloco - sqA - sqErroA - sqB - sqAB;

  const glBloco = r - 1;
  const glA = a - 1;
  const glErroA = (r - 1) * (a - 1);
  const glB = b - 1;
  const glAB = (a - 1) * (b - 1);
  const glErroB = a * (r - 1) * (b - 1);

  const qmErroA = sqErroA / glErroA;
  const qmErroB = sqErroB / glErroB;
  const qmA = sqA / glA;
  const qmB = sqB / glB;
  const qmAB = sqAB / glAB;

  const fA = qmA / qmErroA;
  const fB = qmB / qmErroB;
  const fAB = qmAB / qmErroB;
  const pA = fSf(fA, glA, glErroA);
  const pB = fSf(fB, glB, glErroB);
  const pAB = fSf(fAB, glAB, glErroB);

  const tabela: LinhaAnova[] = [
    { fonte: "Bloco", gl: glBloco, sq: sqBloco, qm: sqBloco / glBloco },
    { fonte: "Fator A (parcela)", gl: glA, sq: sqA, qm: qmA, f: fA, p: pA },
    { fonte: "Erro(a)", gl: glErroA, sq: sqErroA, qm: qmErroA },
    { fonte: "Fator B (subparcela)", gl: glB, sq: sqB, qm: qmB, f: fB, p: pB },
    { fonte: "A × B", gl: glAB, sq: sqAB, qm: qmAB, f: fAB, p: pAB },
    { fonte: "Erro(b)", gl: glErroB, sq: sqErroB, qm: qmErroB },
    { fonte: "Total", gl: N - 1, sq: sqTotal },
  ];

  const mediasA: MediaNivel[] = niveisA.map((n) => {
    const vs = porA.get(n)!.map((o) => o.valor);
    return { nivel: n, media: media(vs), n: vs.length };
  });
  const mediasB: MediaNivel[] = niveisB.map((n) => {
    const vs = porB.get(n)!.map((o) => o.valor);
    return { nivel: n, media: media(vs), n: vs.length };
  });

  return {
    esquema: "PARCELA_SUBDIVIDIDA",
    tabela,
    mediaGeral: g,
    cvParcela: (Math.sqrt(qmErroA) / g) * 100,
    cvSubparcela: (Math.sqrt(qmErroB) / g) * 100,
    fatorA: { f: fA, p: pA, significativo: pA < alpha },
    fatorB: { f: fB, p: pB, significativo: pB < alpha },
    interacao: { f: fAB, p: pAB, significativo: pAB < alpha },
    mediasA,
    mediasB,
  };
}

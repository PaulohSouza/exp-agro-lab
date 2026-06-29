import { fSf } from "./stats.js";
import { bartlett } from "./pressupostos.js";
import { compararMediasLSD, compararMediasTukey, compararMediasScottKnott } from "./comparacao.js";
import type {
  Delineamento,
  Observacao,
  ResultadoAnova,
  MediaTratamento,
  MetodoComparacao,
} from "./types.js";

const ROTULO_METODO: Record<MetodoComparacao, string> = {
  LSD: "LSD (Fisher)",
  Tukey: "Tukey (HSD)",
  ScottKnott: "Scott-Knott",
};

function agrupar<T>(itens: T[], chave: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of itens) {
    const k = chave(it);
    (m.get(k) ?? m.set(k, []).get(k)!).push(it);
  }
  return m;
}
const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const media = (xs: number[]) => soma(xs) / xs.length;

/**
 * ANOVA de 1 fator (DIC ou DBC) com CV, médias, Bartlett e comparação de médias.
 * Método padrão **Tukey** (como no SAGRE); aceita LSD ou Scott-Knott.
 * DBC assume balanceado (cada tratamento uma vez por bloco).
 */
export function anovaUmFator(
  obs: Observacao[],
  delineamento: Delineamento,
  opcoes: { metodo?: MetodoComparacao; alpha?: number } = {},
): ResultadoAnova {
  const metodo: MetodoComparacao = opcoes.metodo ?? "Tukey";
  const alpha = opcoes.alpha ?? 0.05;
  if (obs.length < 3) throw new Error("Dados insuficientes para ANOVA.");
  const valores = obs.map((o) => o.valor);
  const N = valores.length;
  const mediaGeral = media(valores);
  const sqTotal = soma(valores.map((v) => (v - mediaGeral) ** 2));

  const porTrat = agrupar(obs, (o) => o.tratamento);
  const tratamentos = [...porTrat.keys()];
  const k = tratamentos.length;
  if (k < 2) throw new Error("São necessários ao menos 2 tratamentos.");

  // SQ de tratamento
  const sqTrat = soma(
    tratamentos.map((t) => {
      const vs = porTrat.get(t)!.map((o) => o.valor);
      return vs.length * (media(vs) - mediaGeral) ** 2;
    }),
  );
  const glTrat = k - 1;

  let sqBloco = 0;
  let glBloco = 0;
  if (delineamento === "DBC") {
    const porBloco = agrupar(obs, (o) => String(o.bloco));
    const blocos = [...porBloco.keys()];
    glBloco = blocos.length - 1;
    sqBloco = soma(
      blocos.map((b) => {
        const vs = porBloco.get(b)!.map((o) => o.valor);
        return vs.length * (media(vs) - mediaGeral) ** 2;
      }),
    );
  }

  const sqResiduo = sqTotal - sqTrat - sqBloco;
  const glResiduo = N - 1 - glTrat - glBloco;
  if (glResiduo <= 0) throw new Error("Graus de liberdade do resíduo inválidos.");

  const qmTrat = sqTrat / glTrat;
  const qmResiduo = sqResiduo / glResiduo;
  const fTrat = qmTrat / qmResiduo;
  const pTrat = fSf(fTrat, glTrat, glResiduo);
  const cv = (Math.sqrt(qmResiduo) / mediaGeral) * 100;

  const mediasBase: MediaTratamento[] = tratamentos.map((t) => {
    const vs = porTrat.get(t)!.map((o) => o.valor);
    return { tratamento: t, media: media(vs), n: vs.length };
  });
  const comparar =
    metodo === "Tukey"
      ? compararMediasTukey
      : metodo === "ScottKnott"
        ? compararMediasScottKnott
        : compararMediasLSD;
  const medias = comparar(mediasBase, qmResiduo, glResiduo, alpha);

  const bart = bartlett(tratamentos.map((t) => porTrat.get(t)!.map((o) => o.valor)));

  const tabela = [];
  if (delineamento === "DBC") {
    const qmBloco = sqBloco / glBloco;
    tabela.push({
      fonte: "Bloco",
      gl: glBloco,
      sq: sqBloco,
      qm: qmBloco,
      f: qmBloco / qmResiduo,
      p: fSf(qmBloco / qmResiduo, glBloco, glResiduo),
    });
  }
  tabela.push({ fonte: "Tratamento", gl: glTrat, sq: sqTrat, qm: qmTrat, f: fTrat, p: pTrat });
  tabela.push({ fonte: "Resíduo", gl: glResiduo, sq: sqResiduo, qm: qmResiduo });
  tabela.push({ fonte: "Total", gl: N - 1, sq: sqTotal, qm: sqTotal / (N - 1) });

  return {
    delineamento,
    tabela,
    mediaGeral,
    cv,
    glResiduo,
    qmResiduo,
    fTratamento: fTrat,
    pTratamento: pTrat,
    significativo: pTrat < alpha,
    medias,
    pressupostos: {
      bartlettEstatistica: bart.estatistica,
      bartlettP: bart.p,
      homogeneo: bart.p >= alpha,
    },
    comparacao: { metodo: ROTULO_METODO[metodo], alpha },
  };
}

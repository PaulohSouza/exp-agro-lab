import { fSf } from "./stats.js";
import { compararMediasLSD, compararMediasTukey, compararMediasScottKnott } from "./comparacao.js";
import type { Delineamento, MetodoComparacao, MediaTratamento } from "./types.js";

/**
 * Observação de um experimento fatorial (2 ou 3 fatores cruzados), em DIC ou DBC.
 * `fatores` lista o nível de cada fator na ordem dos fatores (A, B[, C]).
 */
export interface ObservacaoFatorial {
  bloco?: string | number;
  fatores: (string | number)[];
  valor: number;
}

export interface LinhaAnovaFatorial {
  fonte: string;
  gl: number;
  sq: number;
  qm?: number;
  f?: number;
  p?: number;
}

export interface MediaFator {
  nivel: string;
  media: number;
  n: number;
  letra?: string;
}

export interface EfeitoPrincipal {
  fator: string;
  f: number;
  p: number;
  significativo: boolean;
  medias: MediaFator[];
}

export interface EfeitoInteracao {
  fonte: string;
  fatores: string[];
  gl: number;
  f: number;
  p: number;
  significativo: boolean;
}

export interface EfeitoSimples {
  /** nível do fator condicionante onde o efeito simples é avaliado. */
  nivelCondicao: string;
  gl: number;
  sq: number;
  qm: number;
  f: number;
  p: number;
  significativo: boolean;
  /** médias do fator-alvo dentro do nível, com letras de comparação. */
  medias: MediaFator[];
}

export interface Desdobramento {
  fatorAlvo: string;
  fatorCondicao: string;
  descricao: string;
  efeitos: EfeitoSimples[];
}

export interface ResultadoAnovaFatorial {
  esquema: "FATORIAL";
  delineamento: Delineamento;
  rotulosFatores: string[];
  tabela: LinhaAnovaFatorial[];
  mediaGeral: number;
  cv: number;
  glResiduo: number;
  qmResiduo: number;
  efeitosPrincipais: EfeitoPrincipal[];
  interacoes: EfeitoInteracao[];
  /** efeitos simples para cada interação dupla significativa. */
  desdobramentos: Desdobramento[];
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

/**
 * ANOVA **fatorial** (2 ou 3 fatores cruzados), em DIC ou DBC, balanceado.
 * Erro único (resíduo) — diferente do split-plot, que tem dois. Quando a
 * interação dupla é significativa, gera o **desdobramento** em efeitos simples
 * (cada fator dentro de cada nível do outro), com comparação de médias.
 * Designs balanceados ⇒ Type I = Type II (como no SAGRE).
 * @see SDD/04-design-detalhado/06-croqui-esquemas.md
 */
export function anovaFatorial(
  observacoes: ObservacaoFatorial[],
  opcoes: {
    delineamento?: Delineamento;
    metodo?: MetodoComparacao;
    alpha?: number;
    rotulos?: string[];
  } = {},
): ResultadoAnovaFatorial {
  const alpha = opcoes.alpha ?? 0.05;
  const metodo = opcoes.metodo ?? "Tukey";
  const delineamento = opcoes.delineamento ?? "DIC";

  const N = observacoes.length;
  if (N < 4) throw new Error("Dados insuficientes para ANOVA fatorial.");

  const m = observacoes[0].fatores.length;
  if (m < 2 || m > 3) throw new Error("ANOVA fatorial suporta 2 ou 3 fatores.");
  if (observacoes.some((o) => o.fatores.length !== m)) {
    throw new Error("Todas as observações devem ter o mesmo número de fatores.");
  }
  const rotulos = opcoes.rotulos ?? ["A", "B", "C"].slice(0, m);

  const niveis: string[][] = [];
  for (let i = 0; i < m; i++) {
    niveis.push([...new Set(observacoes.map((o) => String(o.fatores[i])))]);
    if (niveis[i].length < 2) {
      throw new Error(`O fator ${rotulos[i]} precisa de ao menos 2 níveis.`);
    }
  }
  const nNiveis = niveis.map((n) => n.length);
  const combinacoes = nNiveis.reduce((p, c) => p * c, 1);
  const r = N / combinacoes;
  if (!Number.isInteger(r) || r < 1) {
    throw new Error("ANOVA fatorial exige dados balanceados (sem combinações faltando).");
  }

  const blocos =
    delineamento === "DBC" ? [...new Set(observacoes.map((o) => String(o.bloco)))] : [];
  if (delineamento === "DBC") {
    if (blocos.length < 2) throw new Error("DBC exige ao menos 2 blocos.");
    if (blocos.length !== r) {
      throw new Error("DBC exige uma repetição por bloco (dados balanceados).");
    }
  }

  const valores = observacoes.map((o) => o.valor);
  const g = media(valores);
  const sqTotal = soma(valores.map((v) => (v - g) ** 2));

  // SQ "bruta" do conjunto de fatores S (Σ desvios das médias das células de S).
  const keyOf = (o: ObservacaoFatorial, S: number[]) =>
    S.map((i) => String(o.fatores[i])).join("|");
  const sqBruta = (S: number[]) =>
    soma(
      [...agrupar(observacoes, (o) => keyOf(o, S)).values()].map((vs) =>
        desvio2(
          vs.map((o) => o.valor),
          g,
        ),
      ),
    );

  // subconjuntos não-vazios de fatores (efeitos principais + interações).
  const subconjuntos: number[][] = [];
  for (let mask = 1; mask < 1 << m; mask++) {
    const S: number[] = [];
    for (let i = 0; i < m; i++) if (mask & (1 << i)) S.push(i);
    subconjuntos.push(S);
  }
  // decomposição: SQ(S) = SQbruta(S) − Σ SQ(subconjuntos próprios). Processa por
  // tamanho crescente para que os subconjuntos próprios já estejam calculados.
  const sqEfeito = new Map<string, number>();
  const glEfeito = new Map<string, number>();
  for (const S of [...subconjuntos].sort((a, b) => a.length - b.length)) {
    let sq = sqBruta(S);
    for (const [k, v] of sqEfeito) {
      const T = k.split(",").map(Number);
      if (T.length < S.length && T.every((i) => S.includes(i))) sq -= v;
    }
    sqEfeito.set(S.join(","), sq);
    glEfeito.set(
      S.join(","),
      S.reduce((p, i) => p * (nNiveis[i] - 1), 1),
    );
  }

  const sqBloco =
    delineamento === "DBC"
      ? soma(
          [...agrupar(observacoes, (o) => String(o.bloco)).values()].map((vs) =>
            desvio2(
              vs.map((o) => o.valor),
              g,
            ),
          ),
        )
      : 0;
  const glBloco = delineamento === "DBC" ? blocos.length - 1 : 0;

  const somaSqEfeitos = [...sqEfeito.values()].reduce((a, b) => a + b, 0);
  const somaGlEfeitos = [...glEfeito.values()].reduce((a, b) => a + b, 0);
  const sqResiduo = sqTotal - somaSqEfeitos - sqBloco;
  const glResiduo = N - 1 - somaGlEfeitos - glBloco;
  if (glResiduo < 1)
    throw new Error("Graus de liberdade do resíduo insuficientes (repita o experimento).");
  const qmResiduo = sqResiduo / glResiduo;

  // ordem de exibição: efeitos por tamanho crescente, depois ordem dos fatores.
  const ordenados = [...subconjuntos].sort(
    (a, b) => a.length - b.length || a[0] - b[0] || (a[1] ?? 0) - (b[1] ?? 0),
  );
  const nomeFonte = (S: number[]) => S.map((i) => rotulos[i]).join(" × ");
  const fDe = (S: number[]) => {
    const gl = glEfeito.get(S.join(","))!;
    const sq = sqEfeito.get(S.join(","))!;
    const qm = sq / gl;
    const f = qm / qmResiduo;
    return { gl, sq, qm, f, p: fSf(f, gl, glResiduo) };
  };

  const tabela: LinhaAnovaFatorial[] = [];
  if (delineamento === "DBC") {
    tabela.push({ fonte: "Bloco", gl: glBloco, sq: sqBloco, qm: sqBloco / glBloco });
  }
  for (const S of ordenados) {
    const { gl, sq, qm, f, p } = fDe(S);
    tabela.push({ fonte: nomeFonte(S), gl, sq, qm, f, p });
  }
  tabela.push({ fonte: "Resíduo", gl: glResiduo, sq: sqResiduo, qm: qmResiduo });
  tabela.push({ fonte: "Total", gl: N - 1, sq: sqTotal });

  // comparação de médias preservando a ordem dos níveis, anexando as letras.
  const comparar = (medias: MediaFator[]): MediaFator[] => {
    const entrada: MediaTratamento[] = medias.map((mm) => ({
      tratamento: mm.nivel,
      media: mm.media,
      n: mm.n,
    }));
    const fn =
      metodo === "LSD"
        ? compararMediasLSD
        : metodo === "ScottKnott"
          ? compararMediasScottKnott
          : compararMediasTukey;
    const letras = new Map(
      fn(entrada, qmResiduo, glResiduo, alpha).map((s) => [s.tratamento, s.letra]),
    );
    return medias.map((mm) => ({ ...mm, letra: letras.get(mm.nivel) }));
  };

  const mediasPorNivel = (i: number, itens = observacoes): MediaFator[] => {
    const grupos = agrupar(itens, (o) => String(o.fatores[i]));
    return niveis[i]
      .filter((nv) => grupos.has(nv))
      .map((nv) => {
        const vs = grupos.get(nv)!.map((o) => o.valor);
        return { nivel: nv, media: media(vs), n: vs.length };
      });
  };

  const efeitosPrincipais: EfeitoPrincipal[] = [];
  for (let i = 0; i < m; i++) {
    const { f, p } = fDe([i]);
    efeitosPrincipais.push({
      fator: rotulos[i],
      f,
      p,
      significativo: p < alpha,
      medias: comparar(mediasPorNivel(i)),
    });
  }

  const interacoes: EfeitoInteracao[] = ordenados
    .filter((S) => S.length >= 2)
    .map((S) => {
      const { gl, f, p } = fDe(S);
      return {
        fonte: nomeFonte(S),
        fatores: S.map((i) => rotulos[i]),
        gl,
        f,
        p,
        significativo: p < alpha,
      };
    });

  // efeito simples do fator `alvo` dentro de cada nível do fator `cond`.
  const desdobrar = (alvo: number, cond: number): Desdobramento => {
    const efeitos: EfeitoSimples[] = niveis[cond].map((nc) => {
      const subset = observacoes.filter((o) => String(o.fatores[cond]) === nc);
      const mediaCond = media(subset.map((o) => o.valor));
      const medias = mediasPorNivel(alvo, subset);
      const sq = soma(medias.map((mm) => mm.n * (mm.media - mediaCond) ** 2));
      const gl = nNiveis[alvo] - 1;
      const qm = sq / gl;
      const f = qm / qmResiduo;
      const p = fSf(f, gl, glResiduo);
      return {
        nivelCondicao: nc,
        gl,
        sq,
        qm,
        f,
        p,
        significativo: p < alpha,
        medias: comparar(medias),
      };
    });
    return {
      fatorAlvo: rotulos[alvo],
      fatorCondicao: rotulos[cond],
      descricao: `${rotulos[alvo]} dentro de cada nível de ${rotulos[cond]}`,
      efeitos,
    };
  };

  // desdobra cada interação dupla significativa nos dois sentidos.
  const desdobramentos: Desdobramento[] = [];
  for (const S of subconjuntos.filter((s) => s.length === 2)) {
    if (fDe(S).p >= alpha) continue;
    const [i, j] = S;
    desdobramentos.push(desdobrar(i, j), desdobrar(j, i));
  }

  return {
    esquema: "FATORIAL",
    delineamento,
    rotulosFatores: rotulos,
    tabela,
    mediaGeral: g,
    cv: (Math.sqrt(qmResiduo) / g) * 100,
    glResiduo,
    qmResiduo,
    efeitosPrincipais,
    interacoes,
    desdobramentos,
    comparacao: { metodo, alpha },
  };
}

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { anovaUmFator, type Observacao } from "./anova.js";
import { anovaFatorial, type ObservacaoFatorial } from "./factorial.js";
import { anovaSplitPlot, type ObservacaoSplit } from "./splitPlot.js";
import { kruskalWallis, friedman, type ObservacaoNP } from "./naoParametrico.js";
import { aplicarTransformacao, boxCoxLambda, type ObservacaoModelo } from "./transform.js";

/**
 * GOLDEN TESTS vs SAGRE — valida a estatística portada (ANOVA 1 fator, fatorial
 * 2 e 3 fatores + desdobramento) contra a engine real do SAGRE (ExpDes.pt), com
 * dados reais das planilhas de teste do SAGRE-app.
 *
 * As referências (golden/reference.json) e os dados (golden/data/*.csv) são
 * GERADOS por golden/gen-reference.R e VERSIONADOS — a CI compara sem precisar
 * de R. Para regenerar: `Rscript packages/analytics/golden/gen-reference.R`.
 */

interface LinhaRef {
  fonte: string;
  gl: number;
  sq: number;
  qm: number;
  f?: number;
  p?: number;
}
interface MediaRef {
  tratamento: string;
  media: number;
  grupos: string;
}
interface CasoRef {
  id: string;
  csv: string;
  tipo: "DBC1" | "DIC1" | "FAT2" | "FAT3" | "SPLIT";
  delineamento: "DIC" | "DBC";
  rotulos?: string[];
  bloco: string;
  trat?: string;
  fatorA?: string;
  fatorB?: string;
  resposta: string;
  n: number;
  cv?: number;
  cvParcela?: number;
  cvSubparcela?: number;
  glResiduo?: number;
  qmResiduo?: number;
  anova: LinhaRef[];
  medias?: MediaRef[] | null;
}

/** conjunto de pares {t1,t2} que compartilham ≥1 letra (mesmo grupo). */
function paresMesmoGrupo(itens: { tratamento: string; grupos: string }[]): Set<string> {
  const pares = new Set<string>();
  for (let i = 0; i < itens.length; i++) {
    for (let j = i + 1; j < itens.length; j++) {
      const a = new Set(itens[i].grupos.split(""));
      const compartilha = itens[j].grupos.split("").some((c) => a.has(c));
      if (compartilha) pares.add([itens[i].tratamento, itens[j].tratamento].sort().join("|"));
    }
  }
  return pares;
}

interface NaoParamRef {
  id: string;
  csv: string;
  tipo: "kruskal" | "friedman";
  trat: string;
  bloco?: string;
  resposta: string;
  estatistica: number;
  gl: number;
  p: number;
}
interface TransfRef {
  id: string;
  csv: string;
  delineamento: "DIC" | "DBC";
  trat: string;
  bloco: string;
  resposta: string;
  lambdaBoxCox: number;
  pipelines: { tipo: "log" | "raiz"; constante: number; fTrat: number; cv: number }[];
}

const golden = JSON.parse(
  readFileSync(new URL("../golden/reference.json", import.meta.url), "utf8"),
) as { casos: CasoRef[]; naoParametricos: NaoParamRef[]; transformacoes: TransfRef[] };

/** parser CSV mínimo (dados do SAGRE: sem vírgulas embutidas, aspas opcionais). */
function lerCsv(nome: string): Record<string, string>[] {
  const txt = readFileSync(new URL(`../golden/data/${nome}`, import.meta.url), "utf8").trim();
  const linhas = txt.split(/\r?\n/);
  const desaspar = (s: string) => s.replace(/^"|"$/g, "");
  const cols = linhas[0].split(",").map(desaspar);
  return linhas.slice(1).map((l) => {
    const cells = l.split(",").map(desaspar);
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
}

/** compara com tolerância relativa (SQ/QM podem ser grandes) + piso absoluto. */
function perto(actual: number, expected: number, rel = 1e-5, abs = 1e-6) {
  const tol = Math.max(abs, Math.abs(expected) * rel);
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

for (const caso of golden.casos) {
  describe(`golden vs SAGRE — ${caso.id}`, () => {
    const rows = lerCsv(caso.csv);

    // roda a análise TS equivalente
    let tabela: { fonte: string; gl: number; sq: number; qm?: number; f?: number; p?: number }[];
    let cv: number;
    let glResiduo: number;
    let qmResiduo: number;
    let mediasTS: { tratamento: string; media: number; letra?: string }[] | null = null;

    if (caso.tipo === "SPLIT") {
      const obs: ObservacaoSplit[] = rows.map((r) => ({
        bloco: r[caso.bloco],
        fatorA: r[caso.fatorA!],
        fatorB: r[caso.fatorB!],
        valor: Number(r[caso.resposta]),
      }));
      const res = anovaSplitPlot(obs);
      it("CV(parcela) e CV(subparcela) conferem (dois erros)", () => {
        perto(res.cvParcela, caso.cvParcela!);
        perto(res.cvSubparcela, caso.cvSubparcela!);
      });
      it("tabela ANOVA de split-plot (2 erros) confere com o SAGRE", () => {
        for (const ref of caso.anova) {
          const linha = res.tabela.find((l) => l.fonte === ref.fonte);
          expect(linha, `fonte ausente: ${ref.fonte}`).toBeTruthy();
          expect(linha!.gl, `GL de ${ref.fonte}`).toBe(ref.gl);
          perto(linha!.sq, ref.sq);
          if (linha!.qm != null) perto(linha!.qm, ref.qm);
          if (ref.f != null && linha!.f != null) perto(linha!.f, ref.f, 1e-4);
          if (ref.p != null && linha!.p != null) perto(linha!.p, ref.p, 1e-3, 1e-6);
        }
      });
      return;
    }

    if (caso.tipo === "DBC1" || caso.tipo === "DIC1") {
      const obs: Observacao[] = rows.map((r) => ({
        tratamento: r[caso.trat!],
        bloco: caso.bloco ? r[caso.bloco] : 0,
        valor: Number(r[caso.resposta]),
      }));
      const res = anovaUmFator(obs, caso.delineamento);
      tabela = res.tabela;
      cv = res.cv;
      glResiduo = res.glResiduo;
      qmResiduo = res.qmResiduo;
      mediasTS = res.medias;
    } else {
      const fatCols = caso.rotulos!.map((_, i) => `Fator${i + 1}`);
      const obs: ObservacaoFatorial[] = rows.map((r) => ({
        bloco: r[caso.bloco],
        fatores: fatCols.map((c) => r[c]),
        valor: Number(r[caso.resposta]),
      }));
      const res = anovaFatorial(obs, { delineamento: caso.delineamento, rotulos: caso.rotulos });
      tabela = res.tabela;
      cv = res.cv;
      glResiduo = res.glResiduo;
      qmResiduo = res.qmResiduo;
    }

    it("CV, GL e QM do resíduo conferem", () => {
      perto(cv, caso.cv);
      expect(glResiduo).toBe(caso.glResiduo);
      perto(qmResiduo, caso.qmResiduo);
    });

    it("tabela ANOVA (GL/SQ/QM/F/p) confere com a engine do SAGRE", () => {
      for (const ref of caso.anova) {
        const linha = tabela.find((l) => l.fonte === ref.fonte);
        expect(linha, `fonte ausente: ${ref.fonte}`).toBeTruthy();
        expect(linha!.gl, `GL de ${ref.fonte}`).toBe(ref.gl);
        perto(linha!.sq, ref.sq);
        if (linha!.qm != null) perto(linha!.qm, ref.qm);
        if (ref.f != null && linha!.f != null) perto(linha!.f, ref.f, 1e-4);
        if (ref.p != null && linha!.p != null) perto(linha!.p, ref.p, 1e-3, 1e-6);
      }
    });

    if (caso.medias && mediasTS) {
      const ref = caso.medias;
      const ts = mediasTS;
      it("médias e agrupamento de Tukey conferem com agricolae/SAGRE", () => {
        for (const rm of ref) {
          const m = ts.find((x) => x.tratamento === rm.tratamento);
          expect(m, `tratamento ausente: ${rm.tratamento}`).toBeTruthy();
          perto(m!.media, rm.media);
        }
        // agrupamento equivalente: mesmos pares compartilhando letra (rótulos podem diferir)
        const paresTS = paresMesmoGrupo(
          ts.map((m) => ({ tratamento: m.tratamento, grupos: m.letra ?? "" })),
        );
        const paresRef = paresMesmoGrupo(ref);
        expect([...paresTS].sort()).toEqual([...paresRef].sort());
      });
    }
  });
}

// --- Não-paramétrico: Kruskal-Wallis / Friedman vs R base (kruskal.test/friedman.test). ---
for (const np of golden.naoParametricos) {
  describe(`golden vs R — ${np.id}`, () => {
    const rows = lerCsv(np.csv);
    const obs: ObservacaoNP[] = rows.map((r) => ({
      grupo: r[np.trat],
      bloco: np.bloco ? r[np.bloco] : undefined,
      valor: Number(r[np.resposta]),
    }));
    it(`estatística, gl e p do teste ${np.tipo} conferem`, () => {
      const res = np.tipo === "kruskal" ? kruskalWallis(obs) : friedman(obs);
      const estatistica = "H" in res ? res.H : res.qui2;
      perto(estatistica, np.estatistica, 1e-4);
      expect(res.gl).toBe(np.gl);
      perto(res.p, np.p, 1e-3, 1e-7);
    });
  });
}

// --- Transformações: λ de Box-Cox (vs MASS) + ANOVA na escala transformada (vs aov). ---
for (const tf of golden.transformacoes) {
  describe(`golden vs MASS/aov — ${tf.id}`, () => {
    const rows = lerCsv(tf.csv);
    const obs: ObservacaoModelo[] = rows.map((r) => ({
      grupo: r[tf.trat],
      bloco: r[tf.bloco],
      valor: Number(r[tf.resposta]),
    }));

    it("λ de Box-Cox confere com MASS::boxcox", () => {
      perto(boxCoxLambda(obs).lambda, tf.lambdaBoxCox, 0.02, 0.02);
    });

    for (const pipe of tf.pipelines) {
      it(`ANOVA na escala ${pipe.tipo} (F e CV) confere com aov`, () => {
        const t = aplicarTransformacao(
          obs.map((o) => o.valor),
          pipe.tipo,
          { constante: pipe.constante },
        );
        const res = anovaUmFator(
          obs.map((o, i) => ({ tratamento: String(o.grupo), bloco: o.bloco, valor: t.valores[i] })),
          tf.delineamento,
        );
        const fTrat = res.tabela.find((l) => l.fonte === "Tratamento")!.f!;
        perto(fTrat, pipe.fTrat, 1e-4);
        perto(res.cv, pipe.cv, 1e-4);
      });
    }
  });
}

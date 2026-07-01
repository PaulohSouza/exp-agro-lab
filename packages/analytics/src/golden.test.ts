import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { anovaUmFator, type Observacao } from "./anova.js";
import { anovaFatorial, type ObservacaoFatorial } from "./factorial.js";

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
interface CasoRef {
  id: string;
  csv: string;
  tipo: "DBC1" | "FAT2" | "FAT3";
  delineamento: "DIC" | "DBC";
  rotulos?: string[];
  bloco: string;
  trat?: string;
  resposta: string;
  n: number;
  cv: number;
  glResiduo: number;
  qmResiduo: number;
  anova: LinhaRef[];
}

const golden = JSON.parse(
  readFileSync(new URL("../golden/reference.json", import.meta.url), "utf8"),
) as { casos: CasoRef[] };

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

const FAT_ROT: Record<string, string[]> = {}; // preenchido por caso

for (const caso of golden.casos) {
  describe(`golden vs SAGRE — ${caso.id}`, () => {
    const rows = lerCsv(caso.csv);

    // roda a análise TS equivalente
    let tabela: { fonte: string; gl: number; sq: number; qm?: number; f?: number; p?: number }[];
    let cv: number;
    let glResiduo: number;
    let qmResiduo: number;

    if (caso.tipo === "DBC1") {
      const obs: Observacao[] = rows.map((r) => ({
        tratamento: r[caso.trat!],
        bloco: r[caso.bloco],
        valor: Number(r[caso.resposta]),
      }));
      const res = anovaUmFator(obs, caso.delineamento);
      tabela = res.tabela;
      cv = res.cv;
      glResiduo = res.glResiduo;
      qmResiduo = res.qmResiduo;
    } else {
      const fatCols = caso.rotulos!.map((_, i) => `Fator${i + 1}`);
      FAT_ROT[caso.id] = caso.rotulos!;
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
  });
}

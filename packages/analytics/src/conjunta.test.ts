import { describe, it, expect } from "vitest";
import { anovaConjunta, type ObservacaoConjunta } from "./conjunta.js";

const linha = (r: ReturnType<typeof anovaConjunta>, fonte: string) =>
  r.tabela.find((l) => l.fonte === fonte)!;

// Golden aditivo (2 locais × 2 blocos × 2 trat), SQ calculadas à mão.
// L1B1 T1=10 T2=14 · L1B2 T1=12 T2=16 · L2B1 T1=20 T2=26 · L2B2 T1=22 T2=28
const ADIT: ObservacaoConjunta[] = [
  { local: "L1", bloco: 1, tratamento: "T1", valor: 10 },
  { local: "L1", bloco: 1, tratamento: "T2", valor: 14 },
  { local: "L1", bloco: 2, tratamento: "T1", valor: 12 },
  { local: "L1", bloco: 2, tratamento: "T2", valor: 16 },
  { local: "L2", bloco: 1, tratamento: "T1", valor: 20 },
  { local: "L2", bloco: 1, tratamento: "T2", valor: 26 },
  { local: "L2", bloco: 2, tratamento: "T1", valor: 22 },
  { local: "L2", bloco: 2, tratamento: "T2", valor: 28 },
];

describe("anovaConjunta (golden aditivo)", () => {
  const r = anovaConjunta(ADIT);

  it("SQ por fonte e média geral conferem (à mão)", () => {
    expect(r.mediaGeral).toBeCloseTo(18.5, 6);
    expect(linha(r, "Local").sq).toBeCloseTo(242, 6);
    expect(linha(r, "Bloco/Local").sq).toBeCloseTo(8, 6);
    expect(linha(r, "Tratamento").sq).toBeCloseTo(50, 6);
    expect(linha(r, "Local × Tratamento").sq).toBeCloseTo(2, 6);
    expect(linha(r, "Resíduo").sq).toBeCloseTo(0, 6);
    expect(linha(r, "Total").sq).toBeCloseTo(302, 6);
  });

  it("GL conferem e somam ao total", () => {
    expect(linha(r, "Local").gl).toBe(1);
    expect(linha(r, "Bloco/Local").gl).toBe(2);
    expect(linha(r, "Tratamento").gl).toBe(1);
    expect(linha(r, "Local × Tratamento").gl).toBe(1);
    expect(linha(r, "Resíduo").gl).toBe(2);
    const partes = ["Local", "Bloco/Local", "Tratamento", "Local × Tratamento", "Resíduo"]
      .map((f) => linha(r, f).gl)
      .reduce((a, b) => a + b, 0);
    expect(partes).toBe(linha(r, "Total").gl);
  });

  it("Tratamento é testado pela interação (locais aleatórios): F=25", () => {
    expect(r.fTratamento.f).toBeCloseTo(25, 6); // (50/1) / (2/1)
  });
});

// Caso com resíduo (quebra a aditividade): verifica o encadeamento dos erros.
const COM_RESIDUO: ObservacaoConjunta[] = ADIT.map((o) =>
  o.local === "L2" && o.bloco === 2 && o.tratamento === "T2" ? { ...o, valor: 30 } : o,
);

describe("anovaConjunta (com resíduo) — encadeamento de erros", () => {
  const r = anovaConjunta(COM_RESIDUO);

  it("SQ aditiva e GL fecham", () => {
    const fontes = ["Local", "Bloco/Local", "Tratamento", "Local × Tratamento", "Resíduo"];
    expect(fontes.map((f) => linha(r, f).sq).reduce((a, b) => a + b, 0)).toBeCloseTo(
      linha(r, "Total").sq,
      6,
    );
    expect(r.glResiduo).toBe(2);
  });

  it("F usa o termo de erro correto", () => {
    const qmTrat = linha(r, "Tratamento").qm!;
    const qmLxT = linha(r, "Local × Tratamento").qm!;
    const qmRes = linha(r, "Resíduo").qm!;
    expect(r.fTratamento.f).toBeCloseTo(qmTrat / qmLxT, 6);
    expect(r.fInteracao.f).toBeCloseTo(qmLxT / qmRes, 6);
    expect(r.razaoQMResiduo).toBeGreaterThan(0);
    expect(typeof r.homogeneo).toBe("boolean");
    expect(r.medias.every((m) => typeof m.letra === "string")).toBe(true);
  });

  it("rejeita dados desbalanceados e poucos locais", () => {
    expect(() => anovaConjunta(COM_RESIDUO.slice(0, 7))).toThrow();
    expect(() => anovaConjunta(COM_RESIDUO.filter((o) => o.local === "L1"))).toThrow();
  });
});

import { describe, it, expect } from "vitest";
import { compararMediasTukey, compararMediasScottKnott, compararMediasLSD } from "./comparacao.js";
import type { MediaTratamento } from "./types.js";

const m = (tratamento: string, media: number, n = 4): MediaTratamento => ({ tratamento, media, n });
const letraDe = (rs: MediaTratamento[], t: string) => rs.find((x) => x.tratamento === t)!.letra;

describe("Tukey (HSD)", () => {
  it("separa médias bem distintas e agrupa as próximas", () => {
    // QMres pequeno (0,25), gl=9, n=4 → DMS pequena
    const rs = compararMediasTukey([m("A", 30), m("B", 20.3), m("C", 20)], 0.25, 9);
    expect(letraDe(rs, "A")).toBe("a");
    expect(letraDe(rs, "B")).toBe(letraDe(rs, "C")); // B≈C compartilham
    expect(letraDe(rs, "B")).not.toBe("a");
  });

  it("é mais conservador que o LSD (k=3: A vs B no limiar)", () => {
    // QMres=1, gl=9, n=4 → DMS_LSD≈1,60; DMS_Tukey≈1,98. Diferença A-B=1,8 cai entre as duas.
    const dados = [m("A", 21.8), m("B", 20.0), m("C", 18.0)];
    const lsd = compararMediasLSD(dados, 1, 9);
    const tk = compararMediasTukey(dados, 1, 9);
    expect(letraDe(lsd, "A")).not.toBe(letraDe(lsd, "B")); // LSD separa A e B
    expect(letraDe(tk, "A")).toBe(letraDe(tk, "B")); // Tukey agrupa A e B
  });
});

describe("Scott-Knott", () => {
  it("três grupos bem separados → três letras distintas", () => {
    const rs = compararMediasScottKnott([m("A", 30), m("B", 20), m("C", 10)], 0.5, 9);
    expect(new Set(rs.map((r) => r.letra)).size).toBe(3);
  });

  it("médias praticamente iguais → uma única letra", () => {
    const rs = compararMediasScottKnott([m("A", 20.0), m("B", 20.1), m("C", 19.9)], 2.0, 9);
    expect(new Set(rs.map((r) => r.letra)).size).toBe(1);
  });

  it("dois blocos (alto vs baixo) → letras a,a,b,b e grupos disjuntos", () => {
    const rs = compararMediasScottKnott(
      [m("A", 30), m("B", 29.7), m("C", 10.2), m("D", 10)],
      0.4,
      12,
    );
    expect(letraDe(rs, "A")).toBe(letraDe(rs, "B"));
    expect(letraDe(rs, "C")).toBe(letraDe(rs, "D"));
    expect(letraDe(rs, "A")).not.toBe(letraDe(rs, "C"));
    // Scott-Knott: cada média tem uma única letra (grupos disjuntos)
    expect(rs.every((r) => r.letra!.length === 1)).toBe(true);
  });
});

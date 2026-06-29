import { describe, it, expect } from "vitest";
import { chaveColeta, resolverColeta, dedupLote, type ColetaOffline } from "./sync.js";

describe("sync offline-first", () => {
  it("chaveColeta é idempotente por (avaliacao, parcela, amostra)", () => {
    const k = chaveColeta({ avaliacaoId: "a", parcelaId: "p", numeroAmostra: 1 });
    expect(k).toBe("a:p:1");
  });

  it("resolverColeta: servidor mais novo => conflito; senão aplicar", () => {
    expect(resolverColeta(1000, 500)).toBe("aplicar");
    expect(resolverColeta(1000, null)).toBe("aplicar");
    expect(resolverColeta(1000, 1500)).toBe("conflito");
  });

  it("dedupLote mantém a edição local mais recente por chave", () => {
    const lote: ColetaOffline[] = [
      { avaliacaoId: "a", parcelaId: "p", numeroAmostra: 1, valorColetado: 5, clientUpdatedAt: 100 },
      { avaliacaoId: "a", parcelaId: "p", numeroAmostra: 1, valorColetado: 8, clientUpdatedAt: 200 },
      { avaliacaoId: "a", parcelaId: "q", numeroAmostra: 1, valorColetado: 3, clientUpdatedAt: 100 },
    ];
    const out = dedupLote(lote);
    expect(out).toHaveLength(2);
    expect(out.find((c) => c.parcelaId === "p")?.valorColetado).toBe(8);
  });
});

/**
 * Helpers de sincronização offline-first (RNF-03..07).
 * A coleta no campo é offline; ao reconectar, o lote é enviado e reconciliado.
 */

export interface ColetaOffline {
  avaliacaoId: string;
  parcelaId: string;
  numeroAmostra: number;
  valorColetado?: number;
  /** epoch ms da última edição local (base para resolução de conflito). */
  clientUpdatedAt: number;
}

/** Chave idempotente de uma coleta (evita duplicação em reenvios). */
export function chaveColeta(c: {
  avaliacaoId: string;
  parcelaId: string;
  numeroAmostra: number;
}): string {
  return `${c.avaliacaoId}:${c.parcelaId}:${c.numeroAmostra}`;
}

export type ResultadoColeta = "aplicar" | "conflito";

/**
 * Resolução determinística (last-write-wins por timestamp).
 * Se o servidor tem uma versão MAIS NOVA que a edição local → conflito
 * (mantém o servidor, marca para revisão; nunca descarta em silêncio).
 */
export function resolverColeta(
  clientUpdatedAt: number,
  serverUpdatedAt: number | null,
): ResultadoColeta {
  if (serverUpdatedAt != null && serverUpdatedAt > clientUpdatedAt) return "conflito";
  return "aplicar";
}

/** Deduplica um lote de coletas por chave, mantendo a edição local mais recente. */
export function dedupLote<T extends ColetaOffline>(coletas: readonly T[]): T[] {
  const porChave = new Map<string, T>();
  for (const c of coletas) {
    const k = chaveColeta(c);
    const atual = porChave.get(k);
    if (!atual || c.clientUpdatedAt >= atual.clientUpdatedAt) porChave.set(k, c);
  }
  return [...porChave.values()];
}

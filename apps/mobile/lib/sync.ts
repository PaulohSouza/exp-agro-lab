// Cópia local dos helpers de sync (espelha packages/domain/src/sync.ts).
// Mantida local para evitar atrito de resolução de módulo do Metro no monorepo.

export interface ColetaOffline {
  avaliacaoId: string;
  parcelaId: string;
  numeroAmostra: number;
  valorColetado?: number;
  clientUpdatedAt: number;
  dispositivoId?: string;
}

export function chaveColeta(c: { avaliacaoId: string; parcelaId: string; numeroAmostra: number }): string {
  return `${c.avaliacaoId}:${c.parcelaId}:${c.numeroAmostra}`;
}

export function dedupLote<T extends ColetaOffline>(coletas: readonly T[]): T[] {
  const porChave = new Map<string, T>();
  for (const c of coletas) {
    const k = chaveColeta(c);
    const atual = porChave.get(k);
    if (!atual || c.clientUpdatedAt >= atual.clientUpdatedAt) porChave.set(k, c);
  }
  return [...porChave.values()];
}

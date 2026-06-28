export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export interface Tratamento {
  id: string;
  numeroRef: number;
  tag: string | null;
  nome: string | null;
}
export interface Parcela {
  id: string;
  tratamentoId: string;
  bloco: number;
  numero: number;
  posLinha: number;
  posColuna: number;
  isInicio: boolean;
}
export interface Experimento {
  id: string;
  codigo: string | null;
  titulo: string;
  ensaio: string;
  status: string;
  numTratamentos: number | null;
  numRepeticoes: number | null;
  totalParcelas: number | null;
  espacamentoLinhasM: number | null;
  delineamento?: { nome: string } | null;
  tratamentos?: Tratamento[];
  parcelas?: Parcela[];
  fatores?: Array<{ id: string; nome: string; ordem: number; niveis: { id: string; valor: string }[] }>;
  _count?: { tratamentos: number; parcelas: number };
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

export const api = {
  listar: () => req<Experimento[]>("/experimentos"),
  obter: (id: string) => req<Experimento>(`/experimentos/${id}`),
  criar: (body: Record<string, unknown>) =>
    req<Experimento>("/experimentos", { method: "POST", body: JSON.stringify(body) }),
  definirFatores: (id: string, fatores: Array<{ ordem: number; nome: string; niveis: string[] }>) =>
    req<Experimento>(`/experimentos/${id}/fatores`, { method: "POST", body: JSON.stringify({ fatores }) }),
  gerarCroqui: (id: string, body: { delineamento?: string; blocos?: number; seed?: number; numeroInicial?: number }) =>
    req<Experimento>(`/experimentos/${id}/croqui/gerar`, { method: "POST", body: JSON.stringify(body) }),
  salvarCroqui: (id: string, parcelas: Parcela[]) =>
    req<Experimento>(`/experimentos/${id}/croqui`, { method: "PUT", body: JSON.stringify({ parcelas }) }),
};

/** Cores suaves por índice de tratamento (espelha o sistema-base). */
export function corTratamento(numeroRef: number): string {
  const cores = ["#F6A6A6", "#F8C99B", "#F5E69B", "#A8E0B0", "#9BD2F5", "#C9B3F0", "#F0B3D6", "#B3E6E0"];
  return cores[(numeroRef - 1) % cores.length];
}

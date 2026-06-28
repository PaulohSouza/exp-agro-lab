import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type { ColetaOffline } from "./sync";

/** Base da API. Em device físico use o IP da máquina (não localhost). */
export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_BASE ??
  (Constants.expoConfig?.extra?.apiBase as string) ??
  "http://192.168.0.10:3001";

const TOKEN_KEY = "exp_token";
const USER_KEY = "exp_user";

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  instituicaoId: string;
  isAdminInstituicao: boolean;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function getUser(): Promise<SessionUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}
export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function login(email: string, senha: string): Promise<SessionUser> {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  if (!r.ok) throw new Error("E-mail ou senha inválidos.");
  const data = await r.json();
  await AsyncStorage.multiSet([
    [TOKEN_KEY, data.access_token],
    [USER_KEY, JSON.stringify(data.user)],
  ]);
  return data.user as SessionUser;
}

export interface ExperimentoLista {
  id: string;
  codigo: string | null;
  titulo: string;
  ensaio: string;
  status: string;
  compartilhadoComigo?: boolean;
}

export async function listarExperimentos(): Promise<ExperimentoLista[]> {
  const r = await fetch(`${API_BASE}/experimentos`, { headers: await authHeaders() });
  if (!r.ok) throw new Error(`Falha ao listar (${r.status}).`);
  return r.json();
}

export interface BundleOffline {
  experimento: {
    id: string;
    codigo: string | null;
    titulo: string;
    espacamentoLinhasM: number | null;
    tratamentos: { id: string; numeroRef: number; tag: string | null; nome: string | null }[];
    parcelas: { id: string; numero: number; bloco: number; isInicio: boolean; tratamentoId: string }[];
    avaliacoes: { id: string; nome: string; unidadeColeta: string | null; unidadeSaida: string | null; formula: string | null }[];
  };
  dados: { avaliacaoId: string; parcelaId: string; numAmostra: number; valorColetado: number | null }[];
  serverTime: number;
}

export async function pull(experimentoId: string): Promise<BundleOffline> {
  const r = await fetch(`${API_BASE}/sync/experimentos/${experimentoId}`, { headers: await authHeaders() });
  if (!r.ok) throw new Error(`Falha no pull (${r.status}).`);
  return r.json();
}

export interface PushResultado {
  aplicados: number;
  conflitos: string[];
  ignorados: string[];
  total: number;
}

export async function push(coletas: ColetaOffline[]): Promise<PushResultado> {
  const r = await fetch(`${API_BASE}/sync/push`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ coletas }),
  });
  if (!r.ok) throw new Error(`Falha no push (${r.status}).`);
  return r.json();
}

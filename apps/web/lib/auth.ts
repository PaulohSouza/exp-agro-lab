import { API_BASE } from "./api";

import type { Papel } from "./api";

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  instituicaoId: string;
  papel?: Papel;
  isAdminInstituicao: boolean;
}

const TOKEN_KEY = "exp_token";
const USER_KEY = "exp_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}
function setSession(token: string, user: SessionUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function logout() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.location.href = "/login";
}
export function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function login(email: string, senha: string): Promise<SessionUser> {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  if (!r.ok) throw new Error("E-mail ou senha inválidos.");
  const data = await r.json();
  setSession(data.access_token, data.user);
  return data.user;
}

export async function registrarInstituicao(dto: {
  instituicaoNome: string;
  adminNome: string;
  adminEmail: string;
  adminSenha: string;
}): Promise<SessionUser> {
  const r = await fetch(`${API_BASE}/auth/register-instituicao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!r.ok) throw new Error((await r.text()) || "Falha ao registrar.");
  const data = await r.json();
  setSession(data.access_token, data.user);
  return data.user;
}

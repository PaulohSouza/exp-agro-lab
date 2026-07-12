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
const REFRESH_KEY = "exp_refresh";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}
export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}
function setSession(token: string, user: SessionUser, refreshToken?: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
}
/** Limpa a sessão local (não revoga no servidor). */
export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}
export async function logout() {
  const rt = getRefreshToken();
  if (rt) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
    } catch {
      // best-effort: mesmo sem revogar no servidor, limpa localmente
    }
  }
  clearSession();
  window.location.href = "/login";
}

// Refresh com single-flight: várias chamadas 401 concorrentes compartilham
// a mesma promessa de renovação (evita rotacionar o refresh-token N vezes).
let refreshInFlight: Promise<string | null> | null = null;

/** Troca o refresh-token por um novo access (+ refresh, rotação). Retorna o
 *  novo access token ou null se não há refresh válido (sessão encerrada). */
export function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (refreshInFlight) return refreshInFlight;
  const rt = getRefreshToken();
  if (!rt) return Promise.resolve(null);
  refreshInFlight = (async () => {
    try {
      const r = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!r.ok) {
        clearSession();
        return null;
      }
      const data = await r.json();
      window.localStorage.setItem(TOKEN_KEY, data.access_token);
      window.localStorage.setItem(REFRESH_KEY, data.refresh_token);
      if (data.user) window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.access_token as string;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
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
  setSession(data.access_token, data.user, data.refresh_token);
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
  setSession(data.access_token, data.user, data.refresh_token);
  return data.user;
}

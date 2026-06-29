"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken, getUser, logout, type SessionUser } from "../lib/auth";

export function Protected({ children }: { children: React.ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = "/login";
      return;
    }
    setUser(getUser());
    setPronto(true);
  }, []);

  if (!pronto) return null;

  return (
    <>
      <header style={{ background: "#141B2D", color: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <strong style={{ color: "#fff" }}>EXP-AgroLab</strong>
        <nav className="scroll-x" style={{ display: "flex", gap: 14, fontSize: 14 }}>
          <Link href="/dashboard" style={navlink}>Painel</Link>
          <Link href="/experimentos" style={navlink}>Protocolos</Link>
          <Link href="/cadastros" style={navlink}>Cadastros</Link>
          <Link href="/catalogo" style={navlink}>Catálogo</Link>
          {user?.isAdminInstituicao && <Link href="/usuarios" style={navlink}>Usuários</Link>}
          {user?.isAdminInstituicao && <Link href="/instituicao" style={navlink}>Instituição</Link>}
        </nav>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#9BD2F5" }}>
          {user?.nome}{user?.papel ? ` · ${PAPEL_CURTO[user.papel] ?? user.papel}` : ""}
        </span>
        <button onClick={logout} style={{ background: "none", border: "1px solid #4ec2f0", color: "#4EC2F0", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>sair</button>
      </header>
      {children}
    </>
  );
}

const navlink: React.CSSProperties = { color: "#cfe6f7", textDecoration: "none", whiteSpace: "nowrap", flex: "0 0 auto" };

const PAPEL_CURTO: Record<string, string> = {
  admin_sistema: "admin do sistema",
  gestao_instituicao: "gestão da instituição",
  gestao_departamento: "gestão de departamento",
  coordenador_area: "coordenador de área",
  pesquisador: "pesquisador",
  analista: "analista",
  assistente: "assistente",
};

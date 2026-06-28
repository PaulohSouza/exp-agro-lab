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
      <header style={{ background: "#141B2D", color: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <strong style={{ color: "#fff" }}>EXP-AGROLAB</strong>
        <nav style={{ display: "flex", gap: 14, fontSize: 14 }}>
          <Link href="/experimentos" style={navlink}>Protocolos</Link>
          <Link href="/cadastros" style={navlink}>Cadastros</Link>
          {user?.isAdminInstituicao && <Link href="/usuarios" style={navlink}>Usuários</Link>}
        </nav>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#9BD2F5" }}>
          {user?.nome}{user?.isAdminInstituicao ? " (admin)" : ""}
        </span>
        <button onClick={logout} style={{ background: "none", border: "1px solid #4ec2f0", color: "#4EC2F0", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>sair</button>
      </header>
      {children}
    </>
  );
}

const navlink: React.CSSProperties = { color: "#cfe6f7", textDecoration: "none" };

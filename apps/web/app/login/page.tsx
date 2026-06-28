"use client";
import { useState } from "react";
import { login, registrarInstituicao } from "../../lib/auth";

export default function LoginPage() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("admin@demo.com");
  const [senha, setSenha] = useState("admin123");
  const [reg, setReg] = useState({ instituicaoNome: "", adminNome: "", adminEmail: "", adminSenha: "" });

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setBusy(true);
    try {
      await login(email, senha);
      window.location.href = "/experimentos";
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no login");
    } finally { setBusy(false); }
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setBusy(true);
    try {
      await registrarInstituicao(reg);
      window.location.href = "/experimentos";
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no registro");
    } finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#141B2D" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 360, margin: "0 16px" }}>
        <h1 style={{ margin: "0 0 4px", color: "#1F2940" }}>EXP-AGROLAB</h1>
        <p style={{ marginTop: 0, color: "#7987A1", fontSize: 13 }}>
          {modo === "login" ? "Entrar na sua conta" : "Registrar nova instituição"}
        </p>

        {modo === "login" ? (
          <form onSubmit={entrar}>
            <Campo label="E-mail"><input style={inp} value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Campo>
            <Campo label="Senha"><input style={inp} value={senha} onChange={(e) => setSenha(e.target.value)} type="password" /></Campo>
            <button type="submit" disabled={busy} style={btn}>Entrar</button>
          </form>
        ) : (
          <form onSubmit={registrar}>
            <Campo label="Instituição"><input style={inp} value={reg.instituicaoNome} onChange={(e) => setReg({ ...reg, instituicaoNome: e.target.value })} /></Campo>
            <Campo label="Seu nome"><input style={inp} value={reg.adminNome} onChange={(e) => setReg({ ...reg, adminNome: e.target.value })} /></Campo>
            <Campo label="E-mail"><input style={inp} value={reg.adminEmail} onChange={(e) => setReg({ ...reg, adminEmail: e.target.value })} type="email" /></Campo>
            <Campo label="Senha"><input style={inp} value={reg.adminSenha} onChange={(e) => setReg({ ...reg, adminSenha: e.target.value })} type="password" /></Campo>
            <button type="submit" disabled={busy} style={btn}>Registrar e entrar</button>
          </form>
        )}

        {erro && <p style={{ color: "#F34343", fontSize: 13 }}>{erro}</p>}

        <button onClick={() => { setModo(modo === "login" ? "registro" : "login"); setErro(null); }}
          style={{ background: "none", border: "none", color: "#2D6CDF", cursor: "pointer", fontSize: 13, marginTop: 10, padding: 0 }}>
          {modo === "login" ? "Não tem conta? Registrar instituição" : "Já tem conta? Entrar"}
        </button>

        {modo === "login" && (
          <p style={{ color: "#a9abbd", fontSize: 12, marginTop: 12 }}>
            Demo: admin@demo.com / admin123 · analista@demo.com / analista123
          </p>
        )}
      </div>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "block", marginBottom: 10 }}><div style={{ fontSize: 12, color: "#7987A1", marginBottom: 4 }}>{label}</div>{children}</label>;
}
const inp: React.CSSProperties = { width: "100%", padding: 9, borderRadius: 8, border: "1px solid #d6d6e6", boxSizing: "border-box" };
const btn: React.CSSProperties = { width: "100%", background: "#6FA830", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", marginTop: 4 };

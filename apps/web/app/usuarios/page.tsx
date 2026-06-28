"use client";
import { useEffect, useState } from "react";
import { api, type Usuario } from "../../lib/api";
import { Protected } from "../../components/Protected";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [f, setF] = useState({ nome: "", email: "", senha: "", isAdminInstituicao: false });
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    try { setUsuarios(await api.listarUsuarios()); } catch (e) { setErro(e instanceof Error ? e.message : "falha"); }
  }
  useEffect(() => { recarregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.criarUsuario(f);
      setF({ nome: "", email: "", senha: "", isAdminInstituicao: false });
      recarregar();
    } catch (e) { setErro(e instanceof Error ? e.message : "falha ao criar"); }
  }

  return (
    <Protected>
      <main style={{ maxWidth: 800, margin: "32px auto", padding: 24 }}>
        <div style={{ background: "#1F2940", color: "#fff", padding: "16px 20px", borderRadius: 10 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Usuários da instituição</h1>
        </div>

        <form onSubmit={criar} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "16px 0", background: "#fff", padding: 12, borderRadius: 8 }}>
          <input placeholder="Nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} style={inp} />
          <input placeholder="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={inp} />
          <input placeholder="Senha" type="password" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} style={inp} />
          <label style={{ fontSize: 13, color: "#1F2940", display: "flex", gap: 4, alignItems: "center" }}>
            <input type="checkbox" checked={f.isAdminInstituicao} onChange={(e) => setF({ ...f, isAdminInstituicao: e.target.checked })} /> admin
          </label>
          <button type="submit" style={btn}>Cadastrar usuário</button>
        </form>
        {erro && <p style={{ color: "#F34343" }}>{erro}</p>}

        <div className="tabela-scroll"><table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden" }}>
          <thead><tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
            <th style={th}>Nome</th><th style={th}>E-mail</th><th style={th}>Papel</th><th style={th}>Ativo</th>
          </tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #eaecf3" }}>
                <td style={td}>{u.nome}</td><td style={td}>{u.email}</td>
                <td style={td}>{u.isAdminInstituicao ? "Admin" : "Usuário"}</td>
                <td style={td}>{u.ativo ? "sim" : "não"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </main>
    </Protected>
  );
}

const inp: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #d6d6e6" };
const btn: React.CSSProperties = { background: "#6FA830", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" };
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 13 };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 14 };

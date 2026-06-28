"use client";
import { useEffect, useState } from "react";
import { api, PAPEIS, type Departamento, type Papel, type Unidade, type Usuario } from "../../lib/api";
import { Protected } from "../../components/Protected";

const LABEL: Record<string, string> = Object.fromEntries(PAPEIS.map((p) => [p.value, p.label]));
LABEL["admin_sistema"] = "Administrador do sistema";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [f, setF] = useState<{ nome: string; email: string; senha: string; papel: Papel }>({ nome: "", email: "", senha: "", papel: "analista" });
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    try {
      const [us, deps, unis] = await Promise.all([api.listarUsuarios(), api.departamentos(), api.unidades()]);
      setUsuarios(us); setDepartamentos(deps); setUnidades(unis);
    } catch (e) { setErro(e instanceof Error ? e.message : "falha"); }
  }
  useEffect(() => { recarregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.criarUsuario(f);
      setF({ nome: "", email: "", senha: "", papel: "analista" });
      recarregar();
    } catch (e) { setErro(e instanceof Error ? e.message : "falha ao criar"); }
  }

  return (
    <Protected>
      <main style={{ maxWidth: 920, margin: "32px auto", padding: 24 }}>
        <div style={{ background: "#1F2940", color: "#fff", padding: "16px 20px", borderRadius: 10 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Usuários da instituição</h1>
        </div>

        <form onSubmit={criar} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "16px 0", background: "#fff", padding: 12, borderRadius: 8 }}>
          <input placeholder="Nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} style={inp} />
          <input placeholder="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={inp} />
          <input placeholder="Senha" type="password" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} style={inp} />
          <select value={f.papel} onChange={(e) => setF({ ...f, papel: e.target.value as Papel })} style={inp}>
            {PAPEIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button type="submit" style={btn}>Cadastrar usuário</button>
        </form>
        {erro && <p style={{ color: "#F34343" }}>{erro}</p>}

        <div className="tabela-scroll"><table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden" }}>
          <thead><tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
            <th style={th}>Nome</th><th style={th}>E-mail</th><th style={th}>Papel</th><th style={th}>Departamento</th><th style={th}>Área/Lab</th><th style={th}>Ativo</th>
          </tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <LinhaUsuario key={u.id} u={u} departamentos={departamentos} unidades={unidades} onSave={recarregar} onErro={setErro} />
            ))}
          </tbody>
        </table></div>
        <p style={{ color: "#7987A1", fontSize: 12 }}>
          Papel, departamento e área/laboratório definem o que cada um enxerga no Painel (RBAC). Pesquisador e analista são responsáveis pela coleta.
        </p>
      </main>
    </Protected>
  );
}

function LinhaUsuario({
  u, departamentos, unidades, onSave, onErro,
}: {
  u: Usuario; departamentos: Departamento[]; unidades: Unidade[]; onSave: () => void; onErro: (s: string) => void;
}) {
  const [papel, setPapel] = useState<Papel>((u.papel ?? "analista") as Papel);
  const [departamentoId, setDepartamentoId] = useState(u.departamentoId ?? "");
  const [unidadeId, setUnidadeId] = useState(u.unidadeId ?? "");
  const sujo = papel !== (u.papel ?? "analista") || (departamentoId || "") !== (u.departamentoId ?? "") || (unidadeId || "") !== (u.unidadeId ?? "");
  const ehAdminGlobal = u.papel === "admin_sistema";

  async function salvar() {
    try {
      await api.atualizarUsuario(u.id, { papel, departamentoId: departamentoId || null, unidadeId: unidadeId || null });
      onSave();
    } catch (e) { onErro(e instanceof Error ? e.message : "falha ao salvar"); }
  }

  return (
    <tr style={{ borderBottom: "1px solid #eaecf3" }}>
      <td style={td}>{u.nome}</td>
      <td style={td}>{u.email}</td>
      <td style={td}>
        {ehAdminGlobal ? LABEL["admin_sistema"] : (
          <select value={papel} onChange={(e) => setPapel(e.target.value as Papel)} style={selp}>
            {PAPEIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        )}
      </td>
      <td style={td}>
        <select value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)} style={selp} disabled={ehAdminGlobal}>
          <option value="">—</option>
          {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
      </td>
      <td style={td}>
        <select value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} style={selp} disabled={ehAdminGlobal}>
          <option value="">—</option>
          {unidades.map((un) => <option key={un.id} value={un.id}>{un.nome}</option>)}
        </select>
      </td>
      <td style={td}>
        {u.ativo ? "sim" : "não"}
        {sujo && <button onClick={salvar} style={{ ...btn, marginLeft: 8, padding: "4px 10px", fontSize: 12 }}>salvar</button>}
      </td>
    </tr>
  );
}

const inp: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #d6d6e6" };
const selp: React.CSSProperties = { padding: 6, borderRadius: 6, border: "1px solid #d6d6e6", fontSize: 13, maxWidth: 170 };
const btn: React.CSSProperties = { background: "#6FA830", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" };
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 13 };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 14 };

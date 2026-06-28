"use client";
import { useEffect, useState } from "react";
import { api, type Compartilhamento, type Experimento } from "../../../lib/api";

export function CompartilharTab({ exp }: { exp: Experimento }) {
  const [shares, setShares] = useState<Compartilhamento[]>([]);
  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState<"input" | "edit">("input");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    try { setShares(await api.listarCompartilhamentos(exp.id)); setErro(null); }
    catch (e) { setErro(e instanceof Error ? e.message : "falha"); }
  }
  useEffect(() => { recarregar(); }, [exp.id]);

  async function compartilhar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErro(null);
    if (!email.trim()) return;
    try {
      const s = await api.compartilhar(exp.id, { email: email.trim(), nivel });
      setMsg(s.user ? `Compartilhado com ${s.user.nome}.` : `Convite enviado para ${email} (e-mail simulado).`);
      setEmail("");
      recarregar();
    } catch (e) { setErro(e instanceof Error ? e.message : "falha ao compartilhar"); }
  }

  return (
    <div>
      <p style={{ color: "#7987A1", fontSize: 13, marginTop: 0 }}>
        Dono: <strong style={{ color: "#1F2940" }}>{exp.owner?.nome ?? "—"}</strong>. Compartilhe com outros usuários —
        <strong> input</strong> só lança dados; <strong>edit</strong> também edita o experimento.
      </p>

      <form onSubmit={compartilhar} style={{ display: "flex", gap: 8, alignItems: "center", background: "#f9f9fb", padding: 12, borderRadius: 8 }}>
        <input type="email" placeholder="e-mail do colaborador" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inp, minWidth: 240 }} />
        <select value={nivel} onChange={(e) => setNivel(e.target.value as "input" | "edit")} style={inp}>
          <option value="input">input (lançar dados)</option>
          <option value="edit">edit (editar)</option>
        </select>
        <button type="submit" style={btn}>Compartilhar</button>
      </form>
      {msg && <p style={{ color: "#6FA830", fontSize: 13 }}>{msg}</p>}
      {erro && <p style={{ color: "#F34343", fontSize: 13 }}>{erro}</p>}

      <div className="tabela-scroll"><table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead><tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
          <th style={th}>Colaborador</th><th style={th}>E-mail</th><th style={th}>Nível</th><th style={th}>Status</th><th style={th}></th>
        </tr></thead>
        <tbody>
          {shares.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #eaecf3" }}>
              <td style={td}>{s.user?.nome ?? "—"}</td>
              <td style={td}>{s.user?.email ?? s.convidadoEmail}</td>
              <td style={td}><span style={{ background: s.nivel === "edit" ? "#A8E0B0" : "#9BD2F5", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{s.nivel}</span></td>
              <td style={td}>{s.aceito ? "ativo" : "convite pendente"}</td>
              <td style={td}><button onClick={async () => { await api.revogarCompartilhamento(s.id); recarregar(); }} style={lixo}>revogar</button></td>
            </tr>
          ))}
          {shares.length === 0 && <tr><td style={td} colSpan={5}><span style={{ color: "#a9abbd" }}>Ainda não compartilhado.</span></td></tr>}
        </tbody>
      </table></div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", fontSize: 13 };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 14 };
const inp: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #d6d6e6" };
const btn: React.CSSProperties = { background: "#6FA830", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" };
const lixo: React.CSSProperties = { background: "none", border: "none", color: "#F34343", cursor: "pointer", fontSize: 12 };

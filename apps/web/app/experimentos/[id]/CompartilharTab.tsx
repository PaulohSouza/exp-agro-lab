"use client";
import { useEffect, useState } from "react";
import {
  api,
  type Compartilhamento,
  type Experimento,
  type Responsavel,
  type Usuario,
} from "../../../lib/api";

export function CompartilharTab({ exp }: { exp: Experimento }) {
  const [shares, setShares] = useState<Compartilhamento[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selResp, setSelResp] = useState("");
  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState<"INPUT" | "EDIT">("INPUT");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    try {
      setShares(await api.listarCompartilhamentos(exp.id));
      setResponsaveis(await api.listarResponsaveis(exp.id));
      setUsuarios(await api.listarUsuarios());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha");
    }
  }
  useEffect(() => {
    recarregar();
  }, [exp.id]);

  async function addResponsavel() {
    if (!selResp) return;
    try {
      await api.adicionarResponsavel(exp.id, selResp);
      setSelResp("");
      recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha");
    }
  }

  const idsResp = new Set(responsaveis.map((r) => r.user.id));

  async function compartilhar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErro(null);
    if (!email.trim()) return;
    try {
      const s = await api.compartilhar(exp.id, { email: email.trim(), nivel });
      setMsg(
        s.user
          ? `Compartilhado com ${s.user.nome}.`
          : `Convite enviado para ${email} (e-mail simulado).`,
      );
      setEmail("");
      recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha ao compartilhar");
    }
  }

  return (
    <div>
      <p style={{ color: "#7987A1", fontSize: 13, marginTop: 0 }}>
        Dono: <strong style={{ color: "#1F2940" }}>{exp.owner?.nome ?? "—"}</strong>. Compartilhe
        com outros usuários —<strong> input</strong> só lança dados; <strong>edit</strong> também
        edita o experimento.
      </p>

      <form
        onSubmit={compartilhar}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "#f9f9fb",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <input
          type="email"
          placeholder="e-mail do colaborador"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inp, minWidth: 240 }}
        />
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value as "INPUT" | "EDIT")}
          style={inp}
        >
          <option value="INPUT">input (lançar dados)</option>
          <option value="EDIT">edit (editar)</option>
        </select>
        <button type="submit" style={btn}>
          Compartilhar
        </button>
      </form>
      {msg && <p style={{ color: "#6FA830", fontSize: 13 }}>{msg}</p>}
      {erro && <p style={{ color: "#F34343", fontSize: 13 }}>{erro}</p>}

      <div className="tabela-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
              <th style={th}>Colaborador</th>
              <th style={th}>E-mail</th>
              <th style={th}>Nível</th>
              <th style={th}>Status</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {shares.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #eaecf3" }}>
                <td style={td}>{s.user?.nome ?? "—"}</td>
                <td style={td}>{s.user?.email ?? s.convidadoEmail}</td>
                <td style={td}>
                  <span
                    style={{
                      background: s.nivel === "EDIT" ? "#A8E0B0" : "#9BD2F5",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    {s.nivel}
                  </span>
                </td>
                <td style={td}>{s.isAceito ? "ativo" : "convite pendente"}</td>
                <td style={td}>
                  <button
                    onClick={async () => {
                      await api.revogarCompartilhamento(s.id);
                      recarregar();
                    }}
                    style={lixo}
                  >
                    revogar
                  </button>
                </td>
              </tr>
            ))}
            {shares.length === 0 && (
              <tr>
                <td style={td} colSpan={5}>
                  <span style={{ color: "#a9abbd" }}>Ainda não compartilhado.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: "24px 0 6px", color: "#1F2940", fontSize: 16 }}>
        Responsáveis pela coleta
      </h3>
      <p style={{ color: "#7987A1", fontSize: 13, marginTop: 0 }}>
        Pesquisadores e analistas atribuídos veem este experimento no Painel e são responsáveis pela
        coleta de dados.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select value={selResp} onChange={(e) => setSelResp(e.target.value)} style={inp}>
          <option value="">— selecionar usuário —</option>
          {usuarios
            .filter((u) => !idsResp.has(u.id))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
        </select>
        <button onClick={addResponsavel} style={btn}>
          Atribuir responsável
        </button>
      </div>
      <ul style={{ paddingLeft: 18, marginTop: 10 }}>
        {responsaveis.map((r) => (
          <li key={r.id} style={{ marginBottom: 4 }}>
            {r.user.nome} <span style={{ color: "#7987A1", fontSize: 12 }}>({r.user.email})</span>{" "}
            <button
              onClick={async () => {
                await api.removerResponsavel(exp.id, r.user.id);
                recarregar();
              }}
              style={lixo}
            >
              remover
            </button>
          </li>
        ))}
        {responsaveis.length === 0 && (
          <li style={{ color: "#a9abbd", listStyle: "none", marginLeft: -18 }}>
            nenhum responsável atribuído
          </li>
        )}
      </ul>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", fontSize: 13 };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 14 };
const inp: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #d6d6e6" };
const btn: React.CSSProperties = {
  background: "#6FA830",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  cursor: "pointer",
};
const lixo: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#F34343",
  cursor: "pointer",
  fontSize: 12,
};

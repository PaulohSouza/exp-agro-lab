"use client";
import { useEffect, useState } from "react";
import {
  api,
  type Aprovador,
  type Departamento,
  type Instituicao,
  type Usuario,
} from "../../lib/api";
import { Protected } from "../../components/Protected";

export default function InstituicaoPage() {
  const [inst, setInst] = useState<Instituicao | null>(null);
  const [aprovadores, setAprovadores] = useState<Aprovador[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [novoDep, setNovoDep] = useState("");
  const [sel, setSel] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function recarregar() {
    try {
      setInst(await api.obterInstituicao());
      setAprovadores(await api.listarAprovadores());
      setUsuarios(await api.listarUsuarios());
      setDepartamentos(await api.departamentos());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha");
    }
  }
  useEffect(() => {
    recarregar();
  }, []);

  async function criarDepartamento() {
    if (!novoDep.trim()) return;
    try {
      await api.criarDepartamento(novoDep.trim());
      setNovoDep("");
      recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha");
    }
  }

  async function salvarPolitica(politica: string, n: number) {
    setInst(await api.atualizarInstituicao({ politicaAprovacao: politica, numeroAprovadores: n }));
    setMsg("Política salva.");
  }
  async function addAprovador() {
    if (!sel) return;
    try {
      await api.adicionarAprovador(sel);
      setSel("");
      recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha");
    }
  }

  const aprovadorIds = new Set(aprovadores.map((a) => a.userId));

  return (
    <Protected>
      <main style={{ maxWidth: 760, margin: "32px auto", padding: 24 }}>
        <div
          style={{ background: "#1F2940", color: "#fff", padding: "16px 20px", borderRadius: 10 }}
        >
          <h1 style={{ margin: 0, fontSize: 22 }}>Instituição{inst ? ` — ${inst.nome}` : ""}</h1>
        </div>
        {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
        {msg && <p style={{ color: "#6FA830" }}>{msg}</p>}

        {inst && (
          <div style={{ background: "#fff", borderRadius: 10, padding: 16, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Política de aprovação de OS</h3>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <select
                value={inst.politicaAprovacao}
                onChange={(e) => salvarPolitica(e.target.value, inst.numeroAprovadores)}
                style={inp}
              >
                <option value="TODOS">Todos os aprovadores</option>
                <option value="N_DE_M">N de M aprovadores</option>
              </select>
              {inst.politicaAprovacao === "N_DE_M" && (
                <label style={{ fontSize: 13, color: "#1F2940" }}>
                  N ={" "}
                  <input
                    type="number"
                    min={1}
                    value={inst.numeroAprovadores}
                    onChange={(e) => salvarPolitica(inst.politicaAprovacao, Number(e.target.value))}
                    style={{ ...inp, width: 70 }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 10, padding: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Departamentos</h3>
          <ul style={{ paddingLeft: 18 }}>
            {departamentos.map((d) => (
              <li key={d.id} style={{ marginBottom: 4, opacity: d.isAtivo ? 1 : 0.5 }}>
                {d.nome}{" "}
                <span style={{ color: "#7987A1", fontSize: 12 }}>
                  ({d._count?.unidades ?? 0} unid. · {d._count?.usuarios ?? 0} usu.)
                  {d.isAtivo ? "" : " — inativo"}
                </span>{" "}
                {d.isAtivo && (
                  <button
                    onClick={async () => {
                      await api.desativarDepartamento(d.id);
                      recarregar();
                    }}
                    style={lixo}
                  >
                    desativar
                  </button>
                )}
              </li>
            ))}
            {departamentos.length === 0 && (
              <li style={{ color: "#a9abbd", listStyle: "none", marginLeft: -18 }}>
                nenhum departamento
              </li>
            )}
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={novoDep}
              onChange={(e) => setNovoDep(e.target.value)}
              placeholder="Novo departamento"
              style={inp}
            />
            <button onClick={criarDepartamento} style={btn}>
              Adicionar departamento
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, padding: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Aprovadores internos</h3>
          <ul style={{ paddingLeft: 18 }}>
            {aprovadores.map((a) => (
              <li key={a.id} style={{ marginBottom: 4 }}>
                {a.user.nome} <span style={{ color: "#7987A1" }}>({a.user.email})</span>{" "}
                <button
                  onClick={async () => {
                    await api.removerAprovador(a.id);
                    recarregar();
                  }}
                  style={lixo}
                >
                  remover
                </button>
              </li>
            ))}
            {aprovadores.length === 0 && (
              <li style={{ color: "#a9abbd", listStyle: "none", marginLeft: -18 }}>
                nenhum aprovador
              </li>
            )}
          </ul>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={sel} onChange={(e) => setSel(e.target.value)} style={inp}>
              <option value="">— selecionar usuário —</option>
              {usuarios
                .filter((u) => !aprovadorIds.has(u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
            </select>
            <button onClick={addAprovador} style={btn}>
              Adicionar aprovador
            </button>
          </div>
        </div>
      </main>
    </Protected>
  );
}

const inp: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #d6d6e6" };
const btn: React.CSSProperties = {
  background: "#6FA830",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
};
const lixo: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#F34343",
  cursor: "pointer",
  fontSize: 12,
};

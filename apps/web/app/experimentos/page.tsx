"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Experimento } from "../../lib/api";
import { Protected } from "../../components/Protected";

export default function ExperimentosPage() {
  const [lista, setLista] = useState<Experimento[]>([]);
  const [titulo, setTitulo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function recarregar() {
    try {
      setLista(await api.listar());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao listar");
    } finally {
      setCarregando(false);
    }
  }
  useEffect(() => {
    recarregar();
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    try {
      await api.criar({ titulo, ensaio: "interno", espacamentoLinhasM: 0.45, numRepeticoes: 4 });
      setTitulo("");
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao criar");
    }
  }

  return (
    <Protected>
    <main style={{ maxWidth: 900, margin: "32px auto", padding: 24 }}>
      <div style={{ background: "#1F2940", color: "#fff", padding: "16px 20px", borderRadius: 10 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Protocolos / Experimentos</h1>
      </div>

      <form onSubmit={criar} style={{ display: "flex", gap: 8, margin: "20px 0" }}>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do novo experimento"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #d6d6e6" }}
        />
        <button type="submit" style={btn("#6FA830")}>Novo experimento</button>
      </form>

      {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
      {carregando ? (
        <p style={{ color: "#7987A1" }}>Carregando…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
              <th style={th}>Título</th>
              <th style={th}>Ensaio</th>
              <th style={th}>Status</th>
              <th style={th}>Trat.</th>
              <th style={th}>Parcelas</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #eaecf3" }}>
                <td style={td}>
                  {e.codigo ? `${e.codigo} — ` : ""}{e.titulo}
                  {e.compartilhadoComigo && <span style={{ marginLeft: 8, background: "#9BD2F5", color: "#1F2940", padding: "1px 7px", borderRadius: 6, fontSize: 11 }}>compartilhado</span>}
                  {e.owner && <div style={{ fontSize: 11, color: "#a9abbd" }}>dono: {e.owner.nome}</div>}
                </td>
                <td style={td}>{e.ensaio}</td>
                <td style={td}>{e.status}</td>
                <td style={td}>{e._count?.tratamentos ?? e.numTratamentos ?? 0}</td>
                <td style={td}>{e._count?.parcelas ?? e.totalParcelas ?? 0}</td>
                <td style={td}>
                  <Link href={`/experimentos/${e.id}`} style={{ color: "#2D6CDF" }}>abrir →</Link>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td style={td} colSpan={6}>Nenhum experimento ainda.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </main>
    </Protected>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", fontSize: 13 };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 14 };
function btn(bg: string): React.CSSProperties {
  return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer" };
}

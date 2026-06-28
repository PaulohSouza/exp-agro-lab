"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Experimento } from "../../../lib/api";
import { CroquiEditor } from "./CroquiEditor";
import { TratamentosTab } from "./TratamentosTab";

const ABAS = ["Geral", "Fatores", "Tratamentos", "Croqui"] as const;
type Aba = (typeof ABAS)[number];

export default function DetalheExperimento({ params }: { params: { id: string } }) {
  const [exp, setExp] = useState<Experimento | null>(null);
  const [aba, setAba] = useState<Aba>("Geral");
  const [erro, setErro] = useState<string | null>(null);
  const [niveisTxt, setNiveisTxt] = useState("Testemunha, Punto, Agefix, Tidil, Mistura");

  async function recarregar() {
    try {
      setExp(await api.obter(params.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar");
    }
  }
  useEffect(() => {
    recarregar();
  }, [params.id]);

  async function definirFator(e: React.FormEvent) {
    e.preventDefault();
    const niveis = niveisTxt.split(",").map((s) => s.trim()).filter(Boolean);
    if (!niveis.length) return;
    const atualizado = await api.definirFatores(params.id, [{ ordem: 1, nome: "Produto", niveis }]);
    setExp(atualizado);
    setAba("Tratamentos");
  }

  if (erro) return <Wrap><p style={{ color: "#F34343" }}>{erro}</p></Wrap>;
  if (!exp) return <Wrap><p style={{ color: "#7987A1" }}>Carregando…</p></Wrap>;

  return (
    <Wrap>
      <div style={{ background: "#1F2940", color: "#fff", padding: "16px 20px", borderRadius: 10 }}>
        <Link href="/experimentos" style={{ color: "#4EC2F0", fontSize: 13 }}>← Protocolos</Link>
        <h1 style={{ margin: "6px 0 0", fontSize: 22 }}>{exp.codigo ? `${exp.codigo} — ` : ""}{exp.titulo}</h1>
        <span style={{ color: "#9BD2F5", fontSize: 13 }}>{exp.ensaio} • {exp.status}</span>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e1e1ef", margin: "16px 0" }}>
        {ABAS.map((a) => (
          <button key={a} onClick={() => setAba(a)} style={tab(a === aba)}>{a}</button>
        ))}
      </div>

      {aba === "Geral" && (
        <Card>
          <Linha k="Ensaio" v={exp.ensaio} />
          <Linha k="Delineamento" v={exp.delineamento?.nome ?? "—"} />
          <Linha k="Tratamentos" v={String(exp.numTratamentos ?? exp.tratamentos?.length ?? 0)} />
          <Linha k="Repetições/blocos" v={String(exp.numRepeticoes ?? "—")} />
          <Linha k="Total parcelas" v={String(exp.totalParcelas ?? exp.parcelas?.length ?? 0)} />
          <Linha k="Espaçamento linhas (m)" v={String(exp.espacamentoLinhasM ?? "—")} />
        </Card>
      )}

      {aba === "Fatores" && (
        <Card>
          <form onSubmit={definirFator}>
            <p style={{ marginTop: 0, color: "#1F2940", fontWeight: 600 }}>Fator 1 — Produto (níveis separados por vírgula)</p>
            <input value={niveisTxt} onChange={(e) => setNiveisTxt(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d6d6e6" }} />
            <p style={{ color: "#7987A1", fontSize: 13 }}>Ao salvar, os tratamentos são derivados automaticamente.</p>
            <button type="submit" style={btn("#6FA830")}>Definir fator e derivar tratamentos</button>
          </form>
        </Card>
      )}

      {aba === "Tratamentos" && (
        <Card>
          <TratamentosTab exp={exp} onChange={setExp} />
        </Card>
      )}

      {aba === "Croqui" && (
        <Card>
          <CroquiEditor exp={exp} onChange={setExp} />
        </Card>
      )}
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <main style={{ maxWidth: 900, margin: "32px auto", padding: 24 }}>{children}</main>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", borderRadius: 10, padding: 20 }}>{children}</div>;
}
function Linha({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f8" }}>
      <span style={{ color: "#7987A1" }}>{k}</span><strong style={{ color: "#1F2940" }}>{v}</strong>
    </div>
  );
}
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 13 };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 14 };
function tab(ativo: boolean): React.CSSProperties {
  return {
    background: "none", border: "none", cursor: "pointer", padding: "10px 14px",
    color: ativo ? "#1F2940" : "#7987A1", fontWeight: ativo ? 700 : 400,
    borderBottom: ativo ? "2px solid #6FA830" : "2px solid transparent",
  };
}
function btn(bg: string): React.CSSProperties {
  return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer" };
}

"use client";
import { useState } from "react";
import { api, type Experimento } from "../../../lib/api";

interface FatorForm {
  nome: string;
  niveis: string;
}

export function FatoresTab({
  exp,
  onChange,
}: {
  exp: Experimento;
  onChange: (e: Experimento) => void;
}) {
  const iniciais: FatorForm[] = (exp.fatores ?? []).length
    ? (exp.fatores ?? []).map((f) => ({
        nome: f.nome,
        niveis: f.niveis.map((n) => n.valor).join(", "),
      }))
    : [{ nome: "Produto", niveis: "" }];
  const [fatores, setFatores] = useState<FatorForm[]>(iniciais);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function setF(i: number, campo: keyof FatorForm, v: string) {
    setFatores(fatores.map((f, idx) => (idx === i ? { ...f, [campo]: v } : f)));
  }
  function add() {
    if (fatores.length < 3) setFatores([...fatores, { nome: "", niveis: "" }]);
  }
  function remover(i: number) {
    setFatores(fatores.filter((_, idx) => idx !== i));
  }

  const niveisDe = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  const totalTrat = fatores.reduce((acc, f) => acc * Math.max(niveisDe(f.niveis).length, 0), 1);

  async function salvar() {
    setErro(null);
    setMsg(null);
    const payload = fatores
      .map((f, i) => ({
        ordem: i + 1,
        nome: f.nome.trim() || `Fator ${i + 1}`,
        niveis: niveisDe(f.niveis),
      }))
      .filter((f) => f.niveis.length > 0);
    if (!payload.length) {
      setErro("Informe ao menos 1 fator com níveis.");
      return;
    }
    try {
      const atualizado = await api.definirFatores(exp.id, payload);
      onChange(atualizado);
      setMsg(`${atualizado.tratamentos?.length ?? 0} tratamentos derivados.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha");
    }
  }

  return (
    <div>
      <p style={{ color: "#7987A1", fontSize: 13, marginTop: 0 }}>
        Defina de 1 a 3 fatores e seus níveis (separados por vírgula). Os tratamentos são o{" "}
        <strong>produto cartesiano</strong> dos níveis.
      </p>

      {fatores.map((f, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "#7987A1", width: 56, fontSize: 13 }}>Fator {i + 1}</span>
          <input
            placeholder="nome (ex.: Produto, Dose)"
            value={f.nome}
            onChange={(e) => setF(i, "nome", e.target.value)}
            style={{ ...inp, width: 180 }}
          />
          <input
            placeholder="níveis separados por vírgula"
            value={f.niveis}
            onChange={(e) => setF(i, "niveis", e.target.value)}
            style={{ ...inp, flex: 1 }}
          />
          <span style={{ color: "#a9abbd", fontSize: 12, width: 70 }}>
            {niveisDe(f.niveis).length} níveis
          </span>
          {fatores.length > 1 && (
            <button onClick={() => remover(i)} style={lixo}>
              ×
            </button>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        {fatores.length < 3 && (
          <button onClick={add} style={btn("#4EC2F0")}>
            + fator
          </button>
        )}
        <button onClick={salvar} style={btn("#6FA830")}>
          Salvar e derivar tratamentos
        </button>
        <span style={{ color: "#1F2940", fontSize: 13 }}>
          = <strong>{totalTrat || 0}</strong> tratamentos
        </span>
        {msg && <span style={{ color: "#6FA830", fontSize: 13 }}>{msg}</span>}
        {erro && <span style={{ color: "#F34343", fontSize: 13 }}>{erro}</span>}
      </div>
      <p style={{ color: "#a9abbd", fontSize: 12, marginTop: 10 }}>
        ⚠️ Redefinir fatores recria tratamentos, croqui e remove lançamentos existentes.
      </p>
    </div>
  );
}

const inp: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #d6d6e6" };
function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
  };
}
const lixo: React.CSSProperties = {
  background: "none",
  border: "1px solid #f3b1b1",
  color: "#F34343",
  cursor: "pointer",
  borderRadius: 6,
  padding: "4px 9px",
};

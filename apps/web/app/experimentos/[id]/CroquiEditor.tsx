"use client";
import { useMemo, useState } from "react";
import { api, corTratamento, type Experimento, type Parcela, type Tratamento } from "../../../lib/api";

export function CroquiEditor({ exp, onChange }: { exp: Experimento; onChange: (e: Experimento) => void }) {
  const [parcelas, setParcelas] = useState<Parcela[]>(exp.parcelas ?? []);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const tratById = useMemo(() => {
    const m = new Map<string, Tratamento>();
    (exp.tratamentos ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [exp.tratamentos]);

  const numColunas = Math.max(1, ...parcelas.map((p) => p.posColuna + 1));
  const numLinhas = Math.max(1, ...parcelas.map((p) => p.posLinha + 1));
  const grade: (Parcela | null)[][] = Array.from({ length: numLinhas }, () =>
    Array.from({ length: numColunas }, () => null),
  );
  for (const p of parcelas) grade[p.posLinha][p.posColuna] = p;

  function soltar(alvoId: string) {
    if (!dragId || dragId === alvoId) return;
    setParcelas((prev) => {
      const origem = prev.find((p) => p.id === dragId)!;
      const alvo = prev.find((p) => p.id === alvoId)!;
      return prev.map((p) => {
        if (p.id === origem.id) return { ...p, tratamentoId: alvo.tratamentoId };
        if (p.id === alvo.id) return { ...p, tratamentoId: origem.tratamentoId };
        return p;
      });
    });
    setDirty(true);
    setDragId(null);
  }

  async function salvar() {
    try {
      const atualizado = await api.salvarCroqui(exp.id, parcelas);
      setDirty(false);
      setMsg("Layout salvo.");
      onChange(atualizado);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao salvar");
    }
  }

  async function regenerar() {
    const seed = Math.floor(Math.random() * 1e9);
    const atualizado = await api.gerarCroqui(exp.id, {
      delineamento: exp.delineamento?.nome?.toUpperCase().includes("DBC") ? "DBC" : "DBC",
      blocos: exp.numRepeticoes ?? 4,
      seed,
      numeroInicial: 1,
    });
    setParcelas(atualizado.parcelas ?? []);
    setDirty(false);
    setMsg("Croqui recasualizado.");
    onChange(atualizado);
  }

  if (!parcelas.length) {
    return (
      <div>
        <p style={{ color: "#7987A1" }}>Sem croqui ainda. Gere a partir do delineamento e tratamentos.</p>
        <button onClick={regenerar} style={btn("#6FA830")}>Gerar croqui</button>
        {msg && <span style={{ marginLeft: 12 }}>{msg}</span>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button onClick={salvar} disabled={!dirty} style={btn(dirty ? "#6FA830" : "#a9abbd")}>Salvar layout</button>
        <button onClick={regenerar} style={btn("#4EC2F0")}>Recasualizar</button>
        <span style={{ color: "#7987A1", fontSize: 13 }}>
          Arraste um tratamento sobre outro para trocá-los. {dirty ? "• alterações não salvas" : ""}
        </span>
        {msg && <span style={{ color: "#6FA830", fontSize: 13 }}>{msg}</span>}
      </div>

      <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${numColunas}, 84px)`, gap: 6 }}>
        {grade.flatMap((linha, li) =>
          linha.map((p, ci) => {
            if (!p) return <div key={`${li}-${ci}`} />;
            const t = tratById.get(p.tratamentoId);
            return (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragId(p.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltar(p.id)}
                title={`Parcela ${p.numero} • Bloco ${p.bloco}`}
                style={{
                  background: t ? corTratamento(t.numeroRef) : "#eee",
                  border: p.isInicio ? "2px solid #1F2940" : "1px solid rgba(0,0,0,.08)",
                  borderRadius: 8,
                  padding: "8px 6px",
                  textAlign: "center",
                  cursor: "grab",
                  userSelect: "none",
                  minHeight: 56,
                }}
              >
                <div style={{ fontSize: 11, color: "#5a5a6e" }}>{p.numero}{p.isInicio ? " ★" : ""}</div>
                <div style={{ fontWeight: 700, color: "#1F2940" }}>{t?.tag ?? "?"}</div>
                <div style={{ fontSize: 11, color: "#444" }}>{String.fromCharCode(65 + p.posColuna)}</div>
              </div>
            );
          }),
        )}
      </div>
      <p style={{ color: "#7987A1", fontSize: 12, marginTop: 10 }}>
        Colunas = blocos (A, B, C…). ★ = ponto de início. Cores por tratamento.
      </p>
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" };
}

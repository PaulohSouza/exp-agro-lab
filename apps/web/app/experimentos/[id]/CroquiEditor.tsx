"use client";
import { useMemo, useState } from "react";
import {
  api,
  corTratamento,
  type Experimento,
  type Parcela,
  type Tratamento,
} from "../../../lib/api";

type Esquema = "FATORIAL" | "PARCELA_SUBDIVIDIDA";

export function CroquiEditor({
  exp,
  onChange,
}: {
  exp: Experimento;
  onChange: (e: Experimento) => void;
}) {
  const [parcelas, setParcelas] = useState<Parcela[]>(exp.parcelas ?? []);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fatores = useMemo(
    () => [...(exp.fatores ?? [])].sort((a, b) => a.ordem - b.ordem),
    [exp.fatores],
  );
  const podeSplit = fatores.length === 2;
  const [esquema, setEsquema] = useState<Esquema>(
    (exp.esquema as Esquema) ?? (podeSplit ? "FATORIAL" : "FATORIAL"),
  );
  const [fatorPrincipalOrdem, setFatorPrincipalOrdem] = useState<number>(
    exp.fatorPrincipalOrdem ?? fatores[0]?.ordem ?? 1,
  );

  const splitPlot = parcelas.some((p) => p.grupoPrincipal != null);

  const tratById = useMemo(() => {
    const m = new Map<string, Tratamento>();
    (exp.tratamentos ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [exp.tratamentos]);

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
      blocos: exp.numeroRepeticoes ?? 4,
      seed,
      numeroInicial: 1,
      ...(podeSplit ? { esquema, fatorPrincipalOrdem } : {}),
    });
    setParcelas(atualizado.parcelas ?? []);
    setDirty(false);
    setMsg(esquema === "PARCELA_SUBDIVIDIDA" ? "Parcela subdividida gerada." : "Croqui gerado.");
    onChange(atualizado);
  }

  const seletorEsquema = podeSplit ? (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        background: "#eef6fc",
        padding: "8px 12px",
        borderRadius: 8,
        marginBottom: 12,
      }}
    >
      <label style={{ fontSize: 13, color: "#1F2940", fontWeight: 600 }}>Esquema:</label>
      <select value={esquema} onChange={(e) => setEsquema(e.target.value as Esquema)} style={sel}>
        <option value="FATORIAL">Fatorial</option>
        <option value="PARCELA_SUBDIVIDIDA">Parcela subdividida (split-plot)</option>
      </select>
      {esquema === "PARCELA_SUBDIVIDIDA" && (
        <>
          <label style={{ fontSize: 13, color: "#1F2940" }}>Fator principal:</label>
          <select
            value={fatorPrincipalOrdem}
            onChange={(e) => setFatorPrincipalOrdem(Number(e.target.value))}
            style={sel}
          >
            {fatores.map((f) => (
              <option key={f.ordem} value={f.ordem}>
                {f.nome}
              </option>
            ))}
          </select>
        </>
      )}
      <span style={{ fontSize: 12, color: "#7987A1" }}>Aplica ao gerar/recasualizar.</span>
    </div>
  ) : null;

  if (!parcelas.length) {
    return (
      <div>
        {seletorEsquema}
        <p style={{ color: "#7987A1" }}>
          Sem croqui ainda. Gere a partir do delineamento e tratamentos.
        </p>
        <button onClick={regenerar} style={btn("#1F2940")}>
          Gerar croqui
        </button>
        {msg && <span style={{ marginLeft: 12 }}>{msg}</span>}
      </div>
    );
  }

  return (
    <div>
      {seletorEsquema}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button onClick={salvar} disabled={!dirty} style={btn(dirty ? "#1F2940" : "#a9abbd")}>
          Salvar layout
        </button>
        <button onClick={regenerar} style={btn("#4EC2F0")}>
          Recasualizar
        </button>
        <span style={{ color: "#7987A1", fontSize: 13 }}>
          {splitPlot
            ? "Arraste pela borda grossa p/ mover a parcela principal (mesmo bloco); arraste uma subparcela p/ reordenar dentro do grupo."
            : "Arraste um tratamento sobre outro para trocá-los."}{" "}
          {dirty ? "• alterações não salvas" : ""}
        </span>
        {msg && <span style={{ color: "#1F2940", fontSize: 13 }}>{msg}</span>}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        {splitPlot ? (
          <SplitPlotGrade
            parcelas={parcelas}
            tratById={tratById}
            onReordenarSub={(a, b) => {
              setParcelas((prev) => trocarSub(prev, a, b));
              setDirty(true);
              setMsg(null);
            }}
            onTrocarPrincipal={(a, b) => {
              setParcelas((prev) => trocarPrincipal(prev, a, b));
              setDirty(true);
              setMsg(null);
            }}
            onRejeitar={(m) => setMsg(m)}
          />
        ) : (
          <FatorialGrade
            parcelas={parcelas}
            tratById={tratById}
            onTrocar={(dragId, alvoId) => {
              setParcelas((prev) => trocarTratamento(prev, dragId, alvoId));
              setDirty(true);
            }}
          />
        )}

        <ListaTratamentos tratamentos={exp.tratamentos ?? []} />
      </div>
      <p style={{ color: "#7987A1", fontSize: 12, marginTop: 10 }}>
        {splitPlot
          ? "Cada linha com borda grossa = uma parcela principal (fator principal); as células internas são as subparcelas (subfator). Faixas = blocos."
          : "Colunas = blocos (A, B, C…). ★ = ponto de início. Cores por tratamento."}
      </p>
    </div>
  );
}

// ── Manipulações locais (a API revalida a integridade no salvar — 422) ──────────

function trocarTratamento(parcelas: Parcela[], dragId: string, alvoId: string): Parcela[] {
  if (dragId === alvoId) return parcelas;
  const origem = parcelas.find((p) => p.id === dragId);
  const alvo = parcelas.find((p) => p.id === alvoId);
  if (!origem || !alvo) return parcelas;
  return parcelas.map((p) => {
    if (p.id === origem.id) return { ...p, tratamentoId: alvo.tratamentoId };
    if (p.id === alvo.id) return { ...p, tratamentoId: origem.tratamentoId };
    return p;
  });
}

/** Reordena o subfator: troca tratamento + nivelSub entre duas subparcelas do mesmo grupo. */
function trocarSub(parcelas: Parcela[], idA: string, idB: string): Parcela[] {
  const a = parcelas.find((p) => p.id === idA);
  const b = parcelas.find((p) => p.id === idB);
  if (!a || !b) return parcelas;
  return parcelas.map((p) => {
    if (p.id === a.id) return { ...p, tratamentoId: b.tratamentoId, nivelSub: b.nivelSub };
    if (p.id === b.id) return { ...p, tratamentoId: a.tratamentoId, nivelSub: a.nivelSub };
    return p;
  });
}

/** Move a parcela principal inteira: troca conteúdo (tratamento por nivelSub) e nivelPrincipal
 *  entre dois grupos do mesmo bloco, preservando posições/grupoPrincipal. */
function trocarPrincipal(parcelas: Parcela[], grupoA: number, grupoB: number): Parcela[] {
  if (grupoA === grupoB) return parcelas;
  const cellsA = parcelas
    .filter((p) => p.grupoPrincipal === grupoA)
    .sort((x, y) => (x.nivelSub ?? 0) - (y.nivelSub ?? 0));
  const cellsB = parcelas
    .filter((p) => p.grupoPrincipal === grupoB)
    .sort((x, y) => (x.nivelSub ?? 0) - (y.nivelSub ?? 0));
  if (cellsA.length !== cellsB.length) return parcelas;
  const nivelPrincipalA = cellsA[0]?.nivelPrincipal ?? null;
  const nivelPrincipalB = cellsB[0]?.nivelPrincipal ?? null;
  const swap = new Map<string, { tratamentoId: string; nivelPrincipal: number | null }>();
  cellsA.forEach((cell, i) =>
    swap.set(cell.id, {
      tratamentoId: cellsB[i].tratamentoId,
      nivelPrincipal: nivelPrincipalB,
    }),
  );
  cellsB.forEach((cell, i) =>
    swap.set(cell.id, {
      tratamentoId: cellsA[i].tratamentoId,
      nivelPrincipal: nivelPrincipalA,
    }),
  );
  return parcelas.map((p) => (swap.has(p.id) ? { ...p, ...swap.get(p.id)! } : p));
}

// ── Render: fatorial (grade simples) ────────────────────────────────────────────

function FatorialGrade({
  parcelas,
  tratById,
  onTrocar,
}: {
  parcelas: Parcela[];
  tratById: Map<string, Tratamento>;
  onTrocar: (dragId: string, alvoId: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const numColunas = Math.max(1, ...parcelas.map((p) => p.posicaoColuna + 1));
  const numLinhas = Math.max(1, ...parcelas.map((p) => p.posicaoLinha + 1));
  const grade: (Parcela | null)[][] = Array.from({ length: numLinhas }, () =>
    Array.from({ length: numColunas }, () => null),
  );
  for (const p of parcelas) grade[p.posicaoLinha][p.posicaoColuna] = p;

  return (
    <div className="scroll-x">
      <div
        style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(${numColunas}, 84px)`,
          gap: 6,
        }}
      >
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
                onDrop={() => {
                  if (dragId) onTrocar(dragId, p.id);
                  setDragId(null);
                }}
                title={`Parcela ${p.numero} • Bloco ${p.bloco}`}
                style={celula(t, p.isInicio)}
              >
                <div style={{ fontSize: 11, color: "#5a5a6e" }}>
                  {p.numero}
                  {p.isInicio ? " ★" : ""}
                </div>
                <div style={{ fontWeight: 700, color: "#1F2940" }}>{t?.tag ?? "?"}</div>
                <div style={{ fontSize: 11, color: "#444" }}>
                  {String.fromCharCode(65 + p.posicaoColuna)}
                </div>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

// ── Render: split-plot (grupos com borda grossa) ────────────────────────────────

type DragSP =
  { kind: "sub"; id: string; grupo: number } | { kind: "principal"; grupo: number; bloco: number };

function SplitPlotGrade({
  parcelas,
  tratById,
  onReordenarSub,
  onTrocarPrincipal,
  onRejeitar,
}: {
  parcelas: Parcela[];
  tratById: Map<string, Tratamento>;
  onReordenarSub: (idA: string, idB: string) => void;
  onTrocarPrincipal: (grupoA: number, grupoB: number) => void;
  onRejeitar: (msg: string) => void;
}) {
  const [drag, setDrag] = useState<DragSP | null>(null);

  // bloco -> grupoPrincipal -> subparcelas (ordenadas por nivelSub/coluna)
  const blocos = [...new Set(parcelas.map((p) => p.bloco))].sort((a, b) => a - b);
  const porBloco = blocos.map((bloco) => {
    const doBloco = parcelas.filter((p) => p.bloco === bloco);
    const grupos = [...new Set(doBloco.map((p) => p.grupoPrincipal!))].sort((a, b) => a - b);
    return {
      bloco,
      grupos: grupos.map((grupo) => ({
        grupo,
        nivelPrincipal: doBloco.find((p) => p.grupoPrincipal === grupo)?.nivelPrincipal ?? 0,
        subs: doBloco
          .filter((p) => p.grupoPrincipal === grupo)
          .sort(
            (x, y) => (x.nivelSub ?? 0) - (y.nivelSub ?? 0) || x.posicaoColuna - y.posicaoColuna,
          ),
      })),
    };
  });

  return (
    <div className="scroll-x" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {porBloco.map(({ bloco, grupos }) => (
        <div key={bloco}>
          <div style={{ fontSize: 12, color: "#7987A1", marginBottom: 4 }}>Bloco {bloco}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {grupos.map(({ grupo, nivelPrincipal, subs }) => (
              <div
                key={grupo}
                // borda grossa = parcela principal; arrastável p/ mover o grupo (mesmo bloco)
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDrag({ kind: "principal", grupo, bloco });
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag?.kind === "principal") {
                    if (drag.bloco === bloco) onTrocarPrincipal(drag.grupo, grupo);
                    else onRejeitar("A parcela principal só pode mover dentro do mesmo bloco.");
                  }
                  setDrag(null);
                }}
                title={`Parcela principal (fator A nível ${nivelPrincipal + 1}) • Bloco ${bloco}`}
                style={{
                  display: "flex",
                  gap: 4,
                  padding: 5,
                  border: "3px solid #1F2940",
                  borderRadius: 10,
                  background: "#f4f6fb",
                  cursor: "grab",
                  width: "fit-content",
                }}
              >
                {subs.map((p) => {
                  const t = tratById.get(p.tratamentoId);
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDrag({ kind: "sub", id: p.id, grupo });
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (drag?.kind === "sub") {
                          if (drag.grupo === grupo) onReordenarSub(drag.id, p.id);
                          else
                            onRejeitar(
                              "Não pode separar a parcela: subparcela só troca dentro do grupo.",
                            );
                        }
                        setDrag(null);
                      }}
                      title={`Parcela ${p.numero} • subfator nível ${(p.nivelSub ?? 0) + 1}`}
                      style={celula(t, p.isInicio, 70)}
                    >
                      <div style={{ fontSize: 10, color: "#5a5a6e" }}>{p.numero}</div>
                      <div style={{ fontWeight: 700, color: "#1F2940", fontSize: 13 }}>
                        {t?.tag ?? "?"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaTratamentos({ tratamentos }: { tratamentos: Tratamento[] }) {
  return (
    <aside
      style={{ minWidth: 200, border: "1px solid #e1e1ef", borderRadius: 10, overflow: "hidden" }}
    >
      <div
        style={{
          background: "#1F2940",
          color: "#fff",
          padding: "8px 12px",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Tratamentos
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 8 }}>
        {[...tratamentos]
          .sort((a, b) => a.numeroRef - b.numeroRef)
          .map((t) => (
            <li
              key={t.id}
              style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 6px" }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  flexShrink: 0,
                  marginTop: 2,
                  background: corTratamento(t.numeroRef),
                  border: "1px solid rgba(0,0,0,.12)",
                }}
              />
              <span style={{ fontSize: 13, color: "#1F2940" }}>
                <strong>{t.tag ?? `T${t.numeroRef}`}</strong>
                {t.nome ? ` — ${t.nome}` : ""}
              </span>
            </li>
          ))}
      </ul>
    </aside>
  );
}

function celula(t: Tratamento | undefined, isInicio: boolean, minHeight = 56): React.CSSProperties {
  return {
    background: t ? corTratamento(t.numeroRef) : "#eee",
    border: isInicio ? "2px solid #1F2940" : "1px solid rgba(0,0,0,.08)",
    borderRadius: 8,
    padding: "8px 6px",
    textAlign: "center",
    cursor: "grab",
    userSelect: "none",
    minWidth: 64,
    minHeight,
  };
}

const sel: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid #d6d6e6",
  fontSize: 13,
};

function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
  };
}

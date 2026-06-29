"use client";
import { useEffect, useState } from "react";
import { api, type AtividadeExperimento, type Experimento, type ModeloAtividade, type ValorApontamentoInput } from "../../../lib/api";

export function AtividadesTab({ exp }: { exp: Experimento }) {
  const [atividades, setAtividades] = useState<AtividadeExperimento[]>([]);
  const [modelos, setModelos] = useState<ModeloAtividade[]>([]);
  const [sel, setSel] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    setAtividades(await api.listarAtividadesExp(exp.id));
  }
  useEffect(() => {
    recarregar().catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"));
    api.listarModelosAtividade().then(setModelos).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exp.id]);

  async function adicionar() {
    if (!sel) return;
    setErro(null);
    try { await api.criarAtividadeExp(exp.id, { modeloId: sel }); setSel(""); recarregar(); }
    catch (e) { setErro(e instanceof Error ? e.message : "Falha ao adicionar"); }
  }

  return (
    <div>
      {erro && <p style={{ color: "#F34343" }}>{erro}</p>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#eef6fc", padding: 12, borderRadius: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "#1F2940", fontWeight: 600 }}>Adicionar do catálogo:</span>
        <select data-testid="atv-exp-select" value={sel} onChange={(e) => setSel(e.target.value)} style={inp}>
          <option value="">— escolher atividade —</option>
          {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}{m.tipo === "apontamento" ? " (apontamento)" : ""}</option>)}
        </select>
        <button data-testid="atv-exp-add" onClick={adicionar} disabled={!sel} style={btn(sel ? "#1F2940" : "#a9abbd")}>adicionar</button>
        {modelos.length === 0 && <span style={{ fontSize: 12, color: "#7987A1" }}>nenhum modelo no catálogo — cadastre em /catalogo</span>}
      </div>

      {atividades.length === 0 && <p style={{ color: "#a9abbd" }}>Nenhuma atividade registrada.</p>}
      {atividades.map((a) => (
        <AtividadeCard key={a.id} atividade={a} onChange={recarregar} />
      ))}
    </div>
  );
}

function AtividadeCard({ atividade, onChange }: { atividade: AtividadeExperimento; onChange: () => void }) {
  const campos = atividade.modelo?.campos ?? [];
  const valorDe = (rotulo: string) => atividade.valores.find((v) => v.rotulo === rotulo);
  const [form, setForm] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {};
    for (const c of campos) {
      const v = valorDe(c.rotulo);
      if (c.tipo === "booleano") init[c.rotulo] = v?.valorBool ?? false;
      else if (c.tipo === "data") init[c.rotulo] = v?.valorData ? v.valorData.slice(0, 10) : "";
      else if (c.tipo === "numero") init[c.rotulo] = v?.valorNum != null ? String(v.valorNum) : "";
      else init[c.rotulo] = v?.valorTexto ?? "";
    }
    return init;
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setMsg(null); setErro(null);
    const valores: ValorApontamentoInput[] = campos.map((c) => {
      const raw = form[c.rotulo];
      if (c.tipo === "booleano") return { rotulo: c.rotulo, valorBool: Boolean(raw) };
      if (c.tipo === "data") return { rotulo: c.rotulo, valorData: raw ? String(raw) : null };
      if (c.tipo === "numero") return { rotulo: c.rotulo, valorNum: raw === "" ? null : Number(raw) };
      return { rotulo: c.rotulo, valorTexto: raw ? String(raw) : null };
    });
    try { await api.registrarApontamento(atividade.id, valores); setMsg("Apontamento salvo."); onChange(); }
    catch (e) { setErro(e instanceof Error ? e.message.replace(/^\d+\s*/, "") : "Falha ao salvar"); }
  }

  async function remover() {
    if (!confirm(`Remover a atividade "${atividade.nome}"?`)) return;
    await api.removerAtividadeExp(atividade.id); onChange();
  }

  return (
    <div style={{ border: "1px solid #e1e1ef", borderRadius: 10, marginBottom: 14, overflow: "hidden" }}>
      <div style={{ background: "#1F2940", color: "#fff", padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
        <strong>{atividade.nome}</strong>
        <span style={{ background: atividade.tipo === "apontamento" ? "#4EC2F0" : "#C9B3F0", color: "#1F2940", borderRadius: 6, padding: "1px 8px", fontSize: 11 }}>
          {atividade.tipo === "apontamento" ? "apontamento" : "ação"}
        </span>
        <button onClick={remover} style={{ ...mini("#F34343"), marginLeft: "auto" }}>excluir</button>
      </div>

      {atividade.tipo === "apontamento" && campos.length > 0 && (
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {campos.map((c) => (
              <label key={c.rotulo} style={{ fontSize: 13 }}>
                <div style={{ color: "#7987A1", fontSize: 12, marginBottom: 4 }}>{c.rotulo}{c.unidade ? ` (${c.unidade})` : ""}{c.obrigatorio ? " *" : ""}</div>
                {c.tipo === "booleano" ? (
                  <input type="checkbox" checked={Boolean(form[c.rotulo])} onChange={(e) => setForm({ ...form, [c.rotulo]: e.target.checked })} />
                ) : (
                  <input
                    type={c.tipo === "numero" ? "number" : c.tipo === "data" ? "date" : "text"}
                    value={String(form[c.rotulo] ?? "")}
                    onChange={(e) => setForm({ ...form, [c.rotulo]: e.target.value })}
                    style={{ ...inp, width: "100%" }}
                  />
                )}
              </label>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <button data-testid="atv-apont-salvar" onClick={salvar} style={btn("#1F2940")}>Salvar apontamento</button>
            {msg && <span style={{ fontSize: 12, color: "#1F2940" }}>{msg}</span>}
            {erro && <span style={{ fontSize: 12, color: "#F34343" }}>{erro}</span>}
          </div>
        </div>
      )}
      {atividade.tipo === "acao" && (
        <div style={{ padding: 14, fontSize: 13, color: "#7987A1" }}>Atividade de ação — sem coleta de dados.</div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { padding: 8, borderRadius: 6, border: "1px solid #d6d6e6", fontSize: 13 };
function btn(bg: string): React.CSSProperties { return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontSize: 13 }; }
function mini(bg: string): React.CSSProperties { return { background: bg, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }; }

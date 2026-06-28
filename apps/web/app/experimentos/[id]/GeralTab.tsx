"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Experimento, type ObjetoEstudo, type Ref } from "../../../lib/api";

export function GeralTab({ exp, onChange }: { exp: Experimento; onChange: (e: Experimento) => void }) {
  const [f, setF] = useState({
    titulo: exp.titulo ?? "",
    codigo: exp.codigo ?? "",
    ensaio: exp.ensaio ?? "interno",
    objetivo: exp.objetivo ?? "",
    cultivar: exp.cultivar ?? "",
    localId: exp.localId ?? "",
    safraId: exp.safraId ?? "",
    areaPesquisaId: exp.areaPesquisaId ?? "",
    delineamentoId: exp.delineamentoId ?? "",
    numRepeticoes: exp.numRepeticoes?.toString() ?? "",
    parcelaLarguraM: exp.parcelaLarguraM?.toString() ?? "",
    parcelaComprimentoM: exp.parcelaComprimentoM?.toString() ?? "",
    parcelaNumLinhas: exp.parcelaNumLinhas?.toString() ?? "",
    espacamentoLinhasM: exp.espacamentoLinhasM?.toString() ?? "",
    metodologia: exp.metodologia ?? "",
    observacoes: exp.observacoes ?? "",
    justificativa: exp.justificativa ?? "",
  });
  const [refs, setRefs] = useState<{ locais: Ref[]; safras: Ref[]; areas: Ref[]; delineamentos: Ref[]; categorias: Ref[] }>({ locais: [], safras: [], areas: [], delineamentos: [], categorias: [] });
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [subs, setSubs] = useState<Ref[]>([]);
  const [objs, setObjs] = useState<ObjetoEstudo[]>([]);
  const [objetoId, setObjetoId] = useState<string>(exp.objetoEstudoId ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.locais(), api.safras(), api.areas(), api.delineamentos(), api.categorias()])
      .then(([locais, safras, areas, delineamentos, categorias]) => setRefs({ locais, safras, areas, delineamentos, categorias }));
  }, []);
  useEffect(() => { if (cat) api.subcategorias(cat).then(setSubs); else setSubs([]); }, [cat]);
  useEffect(() => { if (sub) api.objetos(sub).then(setObjs); else setObjs([]); }, [sub]);

  function up<K extends keyof typeof f>(k: K, v: string) { setF({ ...f, [k]: v }); }

  async function salvar() {
    const num = (s: string) => (s === "" ? undefined : Number(s));
    const atualizado = await api.atualizar(exp.id, {
      titulo: f.titulo, codigo: f.codigo, ensaio: f.ensaio, objetivo: f.objetivo, cultivar: f.cultivar,
      localId: f.localId, safraId: f.safraId, areaPesquisaId: f.areaPesquisaId, delineamentoId: f.delineamentoId,
      numRepeticoes: num(f.numRepeticoes), parcelaLarguraM: num(f.parcelaLarguraM), parcelaComprimentoM: num(f.parcelaComprimentoM),
      parcelaNumLinhas: num(f.parcelaNumLinhas), espacamentoLinhasM: num(f.espacamentoLinhasM),
      metodologia: f.metodologia, observacoes: f.observacoes, justificativa: f.justificativa,
      ...(objetoId && objetoId !== exp.objetoEstudoId ? { objetoEstudoId: objetoId } : {}),
    });
    onChange(atualizado);
    setMsg("Geral salvo.");
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: "#7987A1", fontSize: 13 }}>Edite os dados do experimento. O delineamento dirige o croqui.</span>
        <span>
          <Link href="/cadastros" style={{ color: "#2D6CDF", fontSize: 13, marginRight: 12 }}>gerenciar cadastros →</Link>
          <button onClick={salvar} style={btn("#6FA830")}>Salvar Geral</button>
          {msg && <span style={{ color: "#6FA830", fontSize: 13, marginLeft: 10 }}>{msg}</span>}
        </span>
      </div>

      <div style={grid}>
        <Campo label="Título"><input style={inp} value={f.titulo} onChange={(e) => up("titulo", e.target.value)} /></Campo>
        <Campo label="Código"><input style={inp} value={f.codigo} onChange={(e) => up("codigo", e.target.value)} placeholder="PC1699" /></Campo>
        <Campo label="Ensaio">
          <select style={inp} value={f.ensaio} onChange={(e) => up("ensaio", e.target.value)}>
            <option value="interno">interno</option><option value="comercial">comercial</option>
          </select>
        </Campo>

        <Campo label="Área de pesquisa"><Select v={f.areaPesquisaId} set={(v) => up("areaPesquisaId", v)} opts={refs.areas} /></Campo>
        <Campo label="Local"><Select v={f.localId} set={(v) => up("localId", v)} opts={refs.locais} /></Campo>
        <Campo label="Safra"><Select v={f.safraId} set={(v) => up("safraId", v)} opts={refs.safras} /></Campo>

        <Campo label="Delineamento"><Select v={f.delineamentoId} set={(v) => up("delineamentoId", v)} opts={refs.delineamentos} /></Campo>
        <Campo label="Repetições/blocos"><input style={inp} value={f.numRepeticoes} onChange={(e) => up("numRepeticoes", e.target.value)} /></Campo>
        <Campo label="Cultivar / variedade"><input style={inp} value={f.cultivar} onChange={(e) => up("cultivar", e.target.value)} /></Campo>
      </div>

      <fieldset style={fs}>
        <legend style={leg}>Objeto de estudo (atual: {exp.objetoEstudo?.nome ?? "—"})</legend>
        <div style={grid}>
          <Campo label="Categoria"><Select v={cat} set={(v) => { setCat(v); setSub(""); setObjetoId(""); }} opts={refs.categorias} ph="— categoria —" /></Campo>
          <Campo label="Subcategoria"><Select v={sub} set={(v) => { setSub(v); setObjetoId(""); }} opts={subs} ph="— subcategoria —" /></Campo>
          <Campo label="Objeto"><Select v={objetoId} set={setObjetoId} opts={objs} ph="— objeto —" /></Campo>
        </div>
      </fieldset>

      <fieldset style={fs}>
        <legend style={leg}>Parcela</legend>
        <div style={grid}>
          <Campo label="Largura (m)"><input style={inp} value={f.parcelaLarguraM} onChange={(e) => up("parcelaLarguraM", e.target.value)} /></Campo>
          <Campo label="Comprimento (m)"><input style={inp} value={f.parcelaComprimentoM} onChange={(e) => up("parcelaComprimentoM", e.target.value)} /></Campo>
          <Campo label="Nº de linhas"><input style={inp} value={f.parcelaNumLinhas} onChange={(e) => up("parcelaNumLinhas", e.target.value)} /></Campo>
          <Campo label="Espaçamento linhas (m)"><input style={inp} value={f.espacamentoLinhasM} onChange={(e) => up("espacamentoLinhasM", e.target.value)} /></Campo>
        </div>
      </fieldset>

      <Campo label="Objetivo"><textarea style={ta} value={f.objetivo} onChange={(e) => up("objetivo", e.target.value)} /></Campo>
      <Campo label="Metodologia"><textarea style={ta} value={f.metodologia} onChange={(e) => up("metodologia", e.target.value)} /></Campo>
      <Campo label="Observações"><textarea style={ta} value={f.observacoes} onChange={(e) => up("observacoes", e.target.value)} /></Campo>
      <Campo label="Justificativa"><textarea style={ta} value={f.justificativa} onChange={(e) => up("justificativa", e.target.value)} /></Campo>
    </div>
  );
}

function Select({ v, set, opts, ph = "—" }: { v: string; set: (v: string) => void; opts: Ref[]; ph?: string }) {
  return (
    <select style={inp} value={v} onChange={(e) => set(e.target.value)}>
      <option value="">{ph}</option>
      {opts.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
    </select>
  );
}
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "block", marginBottom: 10 }}><div style={{ fontSize: 12, color: "#7987A1", marginBottom: 4 }}>{label}</div>{children}</label>;
}

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 };
const inp: React.CSSProperties = { width: "100%", padding: 8, borderRadius: 8, border: "1px solid #d6d6e6", boxSizing: "border-box" };
const ta: React.CSSProperties = { ...inp, minHeight: 48, resize: "vertical" };
const fs: React.CSSProperties = { border: "1px solid #e1e1ef", borderRadius: 8, padding: 12, margin: "12px 0" };
const leg: React.CSSProperties = { color: "#1F2940", fontWeight: 600, fontSize: 13, padding: "0 6px" };
function btn(bg: string): React.CSSProperties { return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }; }

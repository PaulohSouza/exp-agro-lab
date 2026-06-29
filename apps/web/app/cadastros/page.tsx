"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Categoria, type ObjetoEstudo, type Ref } from "../../lib/api";
import { Protected } from "../../components/Protected";

export default function CadastrosPage() {
  return (
    <Protected>
    <main style={{ maxWidth: 980, margin: "32px auto", padding: 24 }}>
      <div style={{ background: "#1F2940", color: "#fff", padding: "16px 20px", borderRadius: 10 }}>
        <Link href="/experimentos" style={{ color: "#4EC2F0", fontSize: 13 }}>← Protocolos</Link>
        <h1 style={{ margin: "6px 0 0", fontSize: 22 }}>Cadastros</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 20 }}>
        <ListaSimples titulo="Locais" tipo="locais" carregar={api.locais} />
        <ListaSimples titulo="Safras" tipo="safras" carregar={api.safras} />
        <ListaSimples titulo="Áreas de pesquisa" tipo="areas" carregar={api.areas} />
        <ListaSimples titulo="Delineamentos" tipo="delineamentos" carregar={api.delineamentos} />
      </div>

      <ObjetoEstudoCadastro />
    </main>
    </Protected>
  );
}

function ListaSimples({ titulo, tipo, carregar }: { titulo: string; tipo: "locais" | "safras" | "areas" | "delineamentos"; carregar: () => Promise<Ref[]> }) {
  const [itens, setItens] = useState<Ref[]>([]);
  const [nome, setNome] = useState("");
  async function recarregar() { setItens(await carregar()); }
  useEffect(() => { recarregar(); }, []);
  async function add() {
    if (!nome.trim()) return;
    await api.criarCadastro(tipo, nome.trim());
    setNome(""); recarregar();
  }
  return (
    <div style={card}>
      <h3 style={h3}>{titulo}</h3>
      <ul style={{ margin: "0 0 10px", paddingLeft: 18, color: "#1F2940" }}>
        {itens.map((i) => <li key={i.id}>{i.nome}</li>)}
        {itens.length === 0 && <li style={{ color: "#a9abbd", listStyle: "none", marginLeft: -18 }}>vazio</li>}
      </ul>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={inp} value={nome} onChange={(e) => setNome(e.target.value)} placeholder={`novo ${titulo.toLowerCase()}`} />
        <button style={btn} onClick={add}>+</button>
      </div>
    </div>
  );
}

function ObjetoEstudoCadastro() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cat, setCat] = useState("");
  const [subs, setSubs] = useState<Ref[]>([]);
  const [sub, setSub] = useState("");
  const [objs, setObjs] = useState<ObjetoEstudo[]>([]);
  const [nCat, setNCat] = useState(""); const [nSub, setNSub] = useState(""); const [nObj, setNObj] = useState("");

  async function recCategorias() { setCategorias(await api.categorias()); }
  useEffect(() => { recCategorias(); }, []);
  useEffect(() => { if (cat) api.subcategorias(cat).then(setSubs); else setSubs([]); setSub(""); }, [cat]);
  useEffect(() => { if (sub) api.objetos(sub).then(setObjs); else setObjs([]); }, [sub]);

  return (
    <div style={{ ...card, marginTop: 16 }}>
      <h3 style={h3}>Objeto de estudo (genérico: categoria → subcategoria → objeto)</h3>
      <p style={{ color: "#7987A1", fontSize: 13, marginTop: 0 }}>Ex.: Cultura → Algodão → "FM 944 GL"; Máquina → Pulverizador → modelo; Pessoa → Atleta → indivíduo.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <div>
          <strong style={lbl}>Categorias</strong>
          {categorias.map((c) => (
            <div key={c.id} onClick={() => setCat(c.id)} style={{ ...item(c.id === cat), display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1 }}>{c.nome}</span>
              <button
                title="Marcar como cultura (habilita marcos de semeadura/colheita)"
                onClick={async (e) => { e.stopPropagation(); await api.atualizarCategoria(c.id, { eCultura: !c.eCultura }); recCategorias(); }}
                style={{ border: "none", borderRadius: 6, padding: "1px 7px", fontSize: 11, cursor: "pointer", background: c.eCultura ? "#9BD2F5" : "#e1e1ef", color: "#1F2940" }}>
                {c.eCultura ? "🌱 cultura" : "cultura?"}
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input style={inp} value={nCat} onChange={(e) => setNCat(e.target.value)} placeholder="nova categoria" />
            <button style={btn} onClick={async () => { if (!nCat.trim()) return; await api.criarCadastro("categorias", nCat.trim()); setNCat(""); recCategorias(); }}>+</button>
          </div>
        </div>
        <div>
          <strong style={lbl}>Subcategorias</strong>
          {subs.map((s) => <div key={s.id} onClick={() => setSub(s.id)} style={item(s.id === sub)}>{s.nome}</div>)}
          {cat && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input style={inp} value={nSub} onChange={(e) => setNSub(e.target.value)} placeholder="nova subcategoria" />
              <button style={btn} onClick={async () => { if (!nSub.trim()) return; await api.criarSubcategoria(cat, nSub.trim()); setNSub(""); setSubs(await api.subcategorias(cat)); }}>+</button>
            </div>
          )}
        </div>
        <div>
          <strong style={lbl}>Objetos</strong>
          {objs.map((o) => <div key={o.id} style={item(false)}>{o.nome}</div>)}
          {sub && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input style={inp} value={nObj} onChange={(e) => setNObj(e.target.value)} placeholder="novo objeto" />
              <button style={btn} onClick={async () => { if (!nObj.trim()) return; await api.criarObjeto(sub, nObj.trim()); setNObj(""); setObjs(await api.objetos(sub)); }}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", borderRadius: 10, padding: 16 };
const h3: React.CSSProperties = { margin: "0 0 10px", color: "#1F2940", fontSize: 15 };
const inp: React.CSSProperties = { flex: 1, padding: 7, borderRadius: 7, border: "1px solid #d6d6e6", width: "100%", boxSizing: "border-box" };
const btn: React.CSSProperties = { background: "#6FA830", color: "#fff", border: "none", borderRadius: 7, padding: "0 12px", cursor: "pointer" };
const lbl: React.CSSProperties = { display: "block", color: "#7987A1", fontSize: 12, marginBottom: 6 };
function item(ativo: boolean): React.CSSProperties {
  return { padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 13, background: ativo ? "#eaf3e6" : "transparent", color: "#1F2940" };
}

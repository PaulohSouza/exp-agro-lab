"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type Departamento, type EscopoModelo, type ModeloAvaliacao, type ModeloAvaliacaoInput, type Papel } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { getUser } from "../../lib/auth";

const ESCOPOS: { value: EscopoModelo; label: string; cor: string }[] = [
  { value: "sistema", label: "Geral (sistema)", cor: "#1F2940" },
  { value: "instituicao", label: "Instituição", cor: "#4EC2F0" },
  { value: "departamento", label: "Departamento", cor: "#C9B3F0" },
];

/** Espelho da regra do domínio `podeGerenciarEscopo` (UI só; API valida de fato). */
function podeGerenciar(papel: Papel | undefined, escopo: EscopoModelo): boolean {
  if (papel === "admin_sistema") return true;
  if (papel === "gestao_instituicao") return escopo === "instituicao" || escopo === "departamento";
  if (papel === "gestao_departamento" || papel === "coordenador_area") return escopo === "departamento";
  return false;
}

const VAZIO: ModeloAvaliacaoInput = {
  nome: "", descricaoColeta: "", numeroPontos: 1, metodologiaRelatorio: "",
  unidadeColeta: "", unidadeSaida: "", calculoRelatorio: "", escopo: "instituicao",
  departamentoId: "", prerequisitoIds: [],
};

export default function CatalogoPage() {
  return (
    <Protected>
      <main style={{ maxWidth: 1100, margin: "32px auto", padding: 24 }}>
        <div style={{ background: "#1F2940", color: "#fff", padding: "16px 20px", borderRadius: 10 }}>
          <Link href="/cadastros" style={{ color: "#4EC2F0", fontSize: 13 }}>← Cadastros</Link>
          <h1 style={{ margin: "6px 0 0", fontSize: 22 }}>Catálogo de avaliações</h1>
          <p style={{ margin: "6px 0 0", color: "#9BD2F5", fontSize: 13 }}>
            Modelos reutilizáveis por escopo. A mesma medida pode existir no padrão do sistema, da instituição e do departamento.
          </p>
        </div>
        <Catalogo />
      </main>
    </Protected>
  );
}

function Catalogo() {
  const user = getUser();
  const papel = user?.papel;
  const [modelos, setModelos] = useState<ModeloAvaliacao[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [filtro, setFiltro] = useState<EscopoModelo | "todos">("todos");
  const [form, setForm] = useState<ModeloAvaliacaoInput>(VAZIO);
  const [editId, setEditId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const escoposGerenciaveis = ESCOPOS.filter((e) => podeGerenciar(papel, e.value));

  async function recarregar() {
    setModelos(await api.listarModelos());
  }
  useEffect(() => {
    recarregar().catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"));
    if (podeGerenciar(papel, "departamento")) api.departamentos().then(setDepartamentos).catch(() => {});
    // ajusta o escopo default do form para um que o usuário possa gerir
    setForm((f) => ({ ...f, escopo: escoposGerenciaveis[0]?.value ?? "instituicao" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visiveis = useMemo(
    () => (filtro === "todos" ? modelos : modelos.filter((m) => m.escopo === filtro)),
    [modelos, filtro],
  );

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setMsg(null);
    if (!form.nome.trim()) return;
    try {
      const body: ModeloAvaliacaoInput = {
        ...form,
        numeroPontos: Number(form.numeroPontos) || 1,
        departamentoId: form.escopo === "departamento" ? form.departamentoId || undefined : undefined,
      };
      if (editId) await api.atualizarModelo(editId, body);
      else await api.criarModelo(body);
      setMsg(editId ? "Modelo atualizado." : "Modelo criado.");
      setForm({ ...VAZIO, escopo: escoposGerenciaveis[0]?.value ?? "instituicao" });
      setEditId(null);
      recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  function editar(m: ModeloAvaliacao) {
    setEditId(m.id);
    setForm({
      nome: m.nome, descricaoColeta: m.descricaoColeta ?? "", numeroPontos: m.numeroPontos,
      metodologiaRelatorio: m.metodologiaRelatorio ?? "", unidadeColeta: m.unidadeColeta ?? "",
      unidadeSaida: m.unidadeSaida ?? "", calculoRelatorio: m.calculoRelatorio ?? "", escopo: m.escopo,
      departamentoId: m.departamentoId ?? "", prerequisitoIds: m.prerequisitos?.map((p) => p.prerequisitoId) ?? [],
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(m: ModeloAvaliacao) {
    if (!confirm(`Remover o modelo "${m.nome}"?`)) return;
    try { await api.removerModelo(m.id); recarregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Falha ao remover"); }
  }

  return (
    <div>
      {/* filtros por escopo */}
      <div style={{ display: "flex", gap: 8, margin: "20px 0 12px", flexWrap: "wrap" }}>
        {(["todos", "sistema", "instituicao", "departamento"] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)} style={chip(filtro === f)}>
            {f === "todos" ? "Todos" : ESCOPOS.find((e) => e.value === f)!.label}
          </button>
        ))}
      </div>

      {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
      {msg && <p style={{ color: "#1F2940" }}>{msg}</p>}

      {/* formulário (só para quem pode gerir algum escopo) */}
      {escoposGerenciaveis.length > 0 && (
        <form onSubmit={salvar} style={{ background: "#f9f9fb", padding: 16, borderRadius: 10, marginBottom: 20 }}>
          <strong style={{ color: "#1F2940" }}>{editId ? "Editar modelo" : "Novo modelo"}</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 10 }}>
            <input placeholder="Nome (ex.: Altura de plantas)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={inp} />
            <input type="number" min={1} placeholder="nº de pontos" value={form.numeroPontos} onChange={(e) => setForm({ ...form, numeroPontos: Number(e.target.value) })} style={inp} />
            <input placeholder="unid. coleta (ex.: kg)" value={form.unidadeColeta} onChange={(e) => setForm({ ...form, unidadeColeta: e.target.value })} style={inp} />
            <input placeholder="unid. saída (ex.: sacas/ha)" value={form.unidadeSaida} onChange={(e) => setForm({ ...form, unidadeSaida: e.target.value })} style={inp} />
            <input placeholder="cálculo p/ relatório (fórmula)" value={form.calculoRelatorio} onChange={(e) => setForm({ ...form, calculoRelatorio: e.target.value })} style={inp} />
            <select value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value as EscopoModelo })} style={inp} disabled={!!editId}>
              {escoposGerenciaveis.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            {form.escopo === "departamento" && (
              <select value={form.departamentoId} onChange={(e) => setForm({ ...form, departamentoId: e.target.value })} style={inp}>
                <option value="">— departamento —</option>
                {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            )}
          </div>
          <textarea placeholder="Descrição da coleta (como será feita)" value={form.descricaoColeta} onChange={(e) => setForm({ ...form, descricaoColeta: e.target.value })} style={{ ...inp, width: "100%", marginTop: 10, minHeight: 48 }} />
          <textarea placeholder="Metodologia p/ relatório (base para a IA redigir)" value={form.metodologiaRelatorio} onChange={(e) => setForm({ ...form, metodologiaRelatorio: e.target.value })} style={{ ...inp, width: "100%", marginTop: 10, minHeight: 48 }} />

          {/* pré-requisitos */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#7987A1", marginBottom: 4 }}>Pré-requisitos (avaliações que precisam ser coletadas junto):</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {modelos.filter((m) => m.id !== editId).map((m) => {
                const on = form.prerequisitoIds?.includes(m.id) ?? false;
                return (
                  <label key={m.id} style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center", background: on ? "#e3eef7" : "#fff", border: "1px solid #d6d6e6", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
                    <input type="checkbox" checked={on} onChange={(e) => {
                      const set = new Set(form.prerequisitoIds ?? []);
                      e.target.checked ? set.add(m.id) : set.delete(m.id);
                      setForm({ ...form, prerequisitoIds: [...set] });
                    }} />
                    {m.nome}
                  </label>
                );
              })}
              {modelos.filter((m) => m.id !== editId).length === 0 && <span style={{ fontSize: 12, color: "#a9abbd" }}>nenhum outro modelo</span>}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" style={btn("#1F2940")}>{editId ? "Salvar" : "Criar modelo"}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setForm({ ...VAZIO, escopo: escoposGerenciaveis[0]?.value ?? "instituicao" }); }} style={btn("#a9abbd")}>cancelar</button>}
          </div>
        </form>
      )}

      {/* tabela */}
      <div className="tabela-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
              {["Avaliação", "Escopo", "Pontos", "Coleta → Saída", "Pré-requisitos", "Usos", "Ações"].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((m) => {
              const podeEditar = podeGerenciar(papel, m.escopo);
              const esc = ESCOPOS.find((e) => e.value === m.escopo)!;
              return (
                <tr key={m.id} style={{ borderBottom: "1px solid #eaecf3" }}>
                  <td style={td}><strong>{m.nome}</strong>{m.descricaoColeta ? <div style={{ fontSize: 11, color: "#7987A1" }}>{m.descricaoColeta}</div> : null}</td>
                  <td style={td}><span style={{ background: esc.cor, color: esc.value === "departamento" ? "#1F2940" : "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>{esc.label}</span></td>
                  <td style={td}>{m.numeroPontos}</td>
                  <td style={td}>{m.unidadeColeta ?? "—"}{m.unidadeSaida ? ` → ${m.unidadeSaida}` : ""}</td>
                  <td style={td}>{m.prerequisitos?.length ? m.prerequisitos.map((p) => p.prerequisito.nome).join(", ") : "—"}</td>
                  <td style={td}>{m._count?.avaliacoes ?? 0}</td>
                  <td style={td}>
                    {podeEditar ? (
                      <>
                        <button onClick={() => editar(m)} style={mini("#4EC2F0")}>editar</button>{" "}
                        <button onClick={() => excluir(m)} style={mini("#F34343")}>x</button>
                      </>
                    ) : <span style={{ color: "#a9abbd", fontSize: 12 }}>leitura</span>}
                  </td>
                </tr>
              );
            })}
            {visiveis.length === 0 && <tr><td style={td} colSpan={7}><span style={{ color: "#a9abbd" }}>Nenhum modelo neste escopo.</span></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { padding: 8, borderRadius: 6, border: "1px solid #d6d6e6", fontSize: 13 };
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 13 };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 13, verticalAlign: "top" };
function btn(bg: string): React.CSSProperties { return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }; }
function mini(bg: string): React.CSSProperties { return { background: bg, color: bg === "#4EC2F0" ? "#1F2940" : "#fff", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }; }
function chip(on: boolean): React.CSSProperties { return { background: on ? "#1F2940" : "#fff", color: on ? "#fff" : "#1F2940", border: "1px solid #1F2940", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontSize: 13 }; }

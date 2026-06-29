"use client";
import { useEffect, useState } from "react";
import { api, type Atividade, type Experimento, type Produto, type Timing, type Tratamento } from "../../../lib/api";

export function TratamentosTab({ exp, onChange }: { exp: Experimento; onChange: (e: Experimento) => void }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [timings, setTimings] = useState<Timing[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listarProdutos(), api.listarAtividades(), api.listarTimings(exp.id)])
      .then(([p, a, t]) => { setProdutos(p); setAtividades(a); setTimings(t); })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar cadastros"));
  }, [exp.id]);

  async function recarregar() {
    onChange(await api.obter(exp.id));
  }

  if (!(exp.tratamentos ?? []).length) {
    return <p style={{ color: "#7987A1" }}>Defina os fatores primeiro (aba Fatores).</p>;
  }

  return (
    <div>
      {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
      {(exp.tratamentos ?? []).map((t) => (
        <TratamentoCard
          key={t.id}
          t={t}
          produtos={produtos}
          atividades={atividades}
          timings={timings}
          onAfter={recarregar}
        />
      ))}
    </div>
  );
}

function TratamentoCard({
  t, produtos, atividades, timings, onAfter,
}: {
  t: Tratamento; produtos: Produto[]; atividades: Atividade[]; timings: Timing[]; onAfter: () => void;
}) {
  const [nome, setNome] = useState(t.nome ?? "");
  const [form, setForm] = useState<{ produtoId: string; modoAplicacao: string; dose: string; unidadeDose: string; volumeCaldaLha: string; referencia: string; timingId: string; atividadeId: string }>({
    produtoId: "", modoAplicacao: "Pulverização", dose: "", unidadeDose: "ml/ha", volumeCaldaLha: "", referencia: "", timingId: "", atividadeId: "",
  });

  async function salvarNome() {
    if (nome !== (t.nome ?? "")) await api.atualizarTratamento(t.id, { nome });
  }

  async function adicionar() {
    if (!form.produtoId) return;
    await api.adicionarProduto(t.id, {
      produtoId: form.produtoId,
      modoAplicacao: form.modoAplicacao || undefined,
      dose: form.dose ? Number(form.dose) : undefined,
      unidadeDose: form.unidadeDose || undefined,
      volumeCaldaLha: form.volumeCaldaLha ? Number(form.volumeCaldaLha) : undefined,
      referencia: form.referencia || undefined,
      timingId: form.timingId || undefined,
      atividadeId: form.atividadeId || undefined,
    });
    setForm({ ...form, produtoId: "", dose: "", referencia: "" });
    onAfter();
  }

  return (
    <div style={{ border: "1px solid #e1e1ef", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ background: "#1F2940", color: "#fff", padding: "10px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <strong>{t.tag}</strong>
        <input value={nome} onChange={(e) => setNome(e.target.value)} onBlur={salvarNome}
          placeholder="Nome do tratamento"
          style={{ flex: 1, padding: 6, borderRadius: 6, border: "none" }} />
      </div>

      <div className="tabela-scroll">
      <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#7987A1", textAlign: "left" }}>
            {["Seq", "Produto", "Modo", "Dose", "Vol. Calda L/ha", "Referência", "Timing", "Atividade", ""].map((h) => (
              <th key={h} style={{ padding: "8px 10px", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(t.produtos ?? []).map((p) => (
            <tr key={p.id} style={{ background: "#f2f8fd", borderTop: "1px solid #e3eef7" }}>
              <td style={cell}>{p.seq}</td>
              <td style={cell}>{p.produto?.nome}</td>
              <td style={cell}>{p.modoAplicacao ?? "—"}</td>
              <td style={cell}>{p.dose ?? "—"} {p.unidadeDose ?? ""}</td>
              <td style={cell}>{p.volumeCaldaLha ?? "—"}</td>
              <td style={cell}>{p.referencia ?? "—"}</td>
              <td style={cell}>{p.timing?.nome ?? "—"}</td>
              <td style={cell}>{p.atividade?.nome ?? "—"}</td>
              <td style={cell}>
                <button onClick={async () => { await api.removerProduto(p.id); onAfter(); }} style={lixo}>excluir</button>
              </td>
            </tr>
          ))}
          {(t.produtos ?? []).length === 0 && (
            <tr><td style={cell} colSpan={9}><span style={{ color: "#a9abbd" }}>Sem produtos.</span></td></tr>
          )}

          {/* linha de adição */}
          <tr style={{ borderTop: "1px solid #e1e1ef" }}>
            <td style={cell}>+</td>
            <td style={cell}>
              <select value={form.produtoId} onChange={(e) => setForm({ ...form, produtoId: e.target.value })} style={inp}>
                <option value="">— produto —</option>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </td>
            <td style={cell}><input value={form.modoAplicacao} onChange={(e) => setForm({ ...form, modoAplicacao: e.target.value })} style={inp} /></td>
            <td style={cell}>
              <input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="dose" style={{ ...inp, width: 56 }} />
              <input value={form.unidadeDose} onChange={(e) => setForm({ ...form, unidadeDose: e.target.value })} style={{ ...inp, width: 56 }} />
            </td>
            <td style={cell}><input value={form.volumeCaldaLha} onChange={(e) => setForm({ ...form, volumeCaldaLha: e.target.value })} style={{ ...inp, width: 64 }} /></td>
            <td style={cell}><input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} style={inp} /></td>
            <td style={cell}>
              <select value={form.timingId} onChange={(e) => setForm({ ...form, timingId: e.target.value })} style={inp}>
                <option value="">—</option>
                {timings.map((tm) => <option key={tm.id} value={tm.id}>{tm.nome}</option>)}
              </select>
            </td>
            <td style={cell}>
              <select value={form.atividadeId} onChange={(e) => setForm({ ...form, atividadeId: e.target.value })} style={inp}>
                <option value="">—</option>
                {atividades.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </td>
            <td style={cell}><button onClick={adicionar} style={addBtn}>adicionar</button></td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}

const cell: React.CSSProperties = { padding: "6px 10px", verticalAlign: "middle" };
const inp: React.CSSProperties = { padding: 5, borderRadius: 6, border: "1px solid #d6d6e6", fontSize: 13, maxWidth: 130 };
const addBtn: React.CSSProperties = { background: "#4EC2F0", color: "#1F2940", fontWeight: 600, border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer" };
const lixo: React.CSSProperties = { background: "none", border: "none", color: "#F34343", cursor: "pointer", fontSize: 12 };

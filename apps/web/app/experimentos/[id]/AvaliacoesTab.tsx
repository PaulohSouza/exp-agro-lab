"use client";
import { useEffect, useMemo, useState } from "react";
import { api, type Avaliacao, type AvaliacaoDado, type Experimento, type RelatorioAvaliacao } from "../../../lib/api";

export function AvaliacoesTab({ exp, onChange }: { exp: Experimento; onChange: (e: Experimento) => void }) {
  const [modo, setModo] = useState<{ tipo: "lista" } | { tipo: "lancar"; aval: Avaliacao } | { tipo: "relatorio"; aval: Avaliacao }>({ tipo: "lista" });
  const avaliacoes = exp.avaliacoes ?? [];

  async function recarregar() {
    onChange(await api.obter(exp.id));
  }

  if (modo.tipo === "lancar") return <Lancar exp={exp} aval={modo.aval} voltar={() => { setModo({ tipo: "lista" }); recarregar(); }} />;
  if (modo.tipo === "relatorio") return <Relatorio aval={modo.aval} voltar={() => setModo({ tipo: "lista" })} />;

  return (
    <div>
      <NovaAvaliacao exp={exp} onCriou={recarregar} />
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
            {["Seq", "Avaliação", "Tipo", "Unid. saída", "Timing", "Lançamentos", "Ações"].map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {avaliacoes.map((a, i) => (
            <tr key={a.id} style={{ borderBottom: "1px solid #eaecf3" }}>
              <td style={td}>#{i + 1}</td>
              <td style={td}><strong>{a.nome}</strong>{a.formula ? <div style={{ fontSize: 11, color: "#7987A1" }}>{a.unidadeColeta} → {a.unidadeSaida}</div> : null}</td>
              <td style={td}>{a.tipo}</td>
              <td style={td}>{a.unidadeSaida ?? "—"}</td>
              <td style={td}>{a.timing?.nome ?? "—"}</td>
              <td style={td}>{a._count?.dados ?? 0}</td>
              <td style={td}>
                <button onClick={() => setModo({ tipo: "lancar", aval: a })} style={mini("#6FA830")}>Lançar</button>{" "}
                {a.formula && <button onClick={() => setModo({ tipo: "relatorio", aval: a })} style={mini("#4EC2F0")}>Relatório</button>}{" "}
                <button onClick={async () => { await api.removerAvaliacao(a.id); recarregar(); }} style={mini("#F34343")}>x</button>
              </td>
            </tr>
          ))}
          {avaliacoes.length === 0 && <tr><td style={td} colSpan={7}><span style={{ color: "#a9abbd" }}>Nenhuma avaliação.</span></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function NovaAvaliacao({ exp, onCriou }: { exp: Experimento; onCriou: () => void }) {
  const [f, setF] = useState({ nome: "", unidadeColeta: "", unidadeSaida: "", formula: "", tipo: "calendarizada", timingId: "" });
  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome.trim()) return;
    await api.criarAvaliacao(exp.id, {
      nome: f.nome,
      unidadeColeta: f.unidadeColeta || undefined,
      unidadeSaida: f.unidadeSaida || undefined,
      formula: f.formula || undefined,
      tipo: f.tipo as Avaliacao["tipo"],
      timingId: f.timingId || undefined,
    } as Partial<Avaliacao>);
    setF({ nome: "", unidadeColeta: "", unidadeSaida: "", formula: "", tipo: "calendarizada", timingId: "" });
    onCriou();
  }
  return (
    <form onSubmit={criar} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#f9f9fb", padding: 12, borderRadius: 8 }}>
      <input placeholder="Nome (ex.: Produtividade)" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} style={{ ...inp, minWidth: 180 }} />
      <input placeholder="unid. coleta (kg/parcela)" value={f.unidadeColeta} onChange={(e) => setF({ ...f, unidadeColeta: e.target.value })} style={inp} />
      <input placeholder="unid. saída (kg/ha)" value={f.unidadeSaida} onChange={(e) => setF({ ...f, unidadeSaida: e.target.value })} style={inp} />
      <input placeholder="fórmula (ex.: (valor/areaUtil)*10000)" value={f.formula} onChange={(e) => setF({ ...f, formula: e.target.value })} style={{ ...inp, minWidth: 200 }} />
      <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} style={inp}>
        <option value="calendarizada">calendarizada</option>
        <option value="condicional">condicional</option>
      </select>
      <select value={f.timingId} onChange={(e) => setF({ ...f, timingId: e.target.value })} style={inp}>
        <option value="">— timing —</option>
        {(exp.timings ?? []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
      </select>
      <button type="submit" style={mini("#6FA830")}>Nova avaliação</button>
    </form>
  );
}

function Lancar({ exp, aval, voltar }: { exp: Experimento; aval: Avaliacao; voltar: () => void }) {
  const usaArea = !!aval.formula && /areaUtil/.test(aval.formula);
  const tratPorId = useMemo(() => new Map((exp.tratamentos ?? []).map((t) => [t.id, t])), [exp.tratamentos]);
  const [valores, setValores] = useState<Record<string, { valor: string; linhas: string; comp: string }>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.listarDados(aval.id).then((dados: AvaliacaoDado[]) => {
      const m: Record<string, { valor: string; linhas: string; comp: string }> = {};
      for (const d of dados) m[d.parcelaId] = { valor: d.valorColetado?.toString() ?? "", linhas: d.numLinhasColhidas?.toString() ?? "", comp: d.comprimentoColhidoM?.toString() ?? "" };
      setValores(m);
    });
  }, [aval.id]);

  const parcelas = [...(exp.parcelas ?? [])].sort((a, b) => a.numero - b.numero);

  async function salvar() {
    const dados = parcelas
      .filter((p) => valores[p.id]?.valor)
      .map((p) => ({
        parcelaId: p.id,
        valorColetado: Number(valores[p.id].valor),
        numLinhasColhidas: usaArea && valores[p.id].linhas ? Number(valores[p.id].linhas) : undefined,
        comprimentoColhidoM: usaArea && valores[p.id].comp ? Number(valores[p.id].comp) : undefined,
      }));
    await api.lancarDados(aval.id, dados);
    setMsg(`${dados.length} lançamento(s) salvos (valor bruto).`);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button onClick={voltar} style={mini("#a9abbd")}>← voltar</button>
        <strong>Lançar: {aval.nome}</strong>
        <span style={{ color: "#7987A1", fontSize: 13 }}>valor bruto por parcela{usaArea ? " + apontamentos da colheita" : ""}</span>
        <button onClick={salvar} style={mini("#6FA830")}>Salvar</button>
        {msg && <span style={{ color: "#6FA830", fontSize: 13 }}>{msg}</span>}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ color: "#7987A1", textAlign: "left" }}>
          <th style={th}>Parcela</th><th style={th}>Bloco</th><th style={th}>Trat.</th>
          <th style={th}>Valor ({aval.unidadeColeta ?? "bruto"})</th>
          {usaArea && <><th style={th}>Nº linhas</th><th style={th}>Compr. (m)</th></>}
        </tr></thead>
        <tbody>
          {parcelas.map((p) => {
            const v = valores[p.id] ?? { valor: "", linhas: "", comp: "" };
            const set = (campo: "valor" | "linhas" | "comp", val: string) => setValores({ ...valores, [p.id]: { ...v, [campo]: val } });
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid #f0f0f8" }}>
                <td style={td}>{p.numero}{p.isInicio ? " ★" : ""}</td>
                <td style={td}>{p.bloco}</td>
                <td style={td}>{tratPorId.get(p.tratamentoId)?.tag ?? "?"}</td>
                <td style={td}><input value={v.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...inp, width: 90 }} /></td>
                {usaArea && <td style={td}><input value={v.linhas} onChange={(e) => set("linhas", e.target.value)} style={{ ...inp, width: 70 }} /></td>}
                {usaArea && <td style={td}><input value={v.comp} onChange={(e) => set("comp", e.target.value)} style={{ ...inp, width: 70 }} /></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Relatorio({ aval, voltar }: { aval: Avaliacao; voltar: () => void }) {
  const [rel, setRel] = useState<RelatorioAvaliacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    api.relatorioAvaliacao(aval.id).then(setRel).catch((e) => setErro(e instanceof Error ? e.message : "falha"));
  }, [aval.id]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button onClick={voltar} style={mini("#a9abbd")}>← voltar</button>
        <strong>Relatório: {aval.nome}</strong>
        <span style={{ color: "#7987A1", fontSize: 13 }}>conversão {aval.unidadeColeta} → {aval.unidadeSaida} (calculada no relatório)</span>
      </div>
      {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
      {!rel ? <p style={{ color: "#7987A1" }}>Carregando…</p> : (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <h4 style={{ margin: "0 0 8px" }}>Por parcela</h4>
            <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ color: "#7987A1", textAlign: "left" }}>
                <th style={th}>Parc.</th><th style={th}>Trat.</th><th style={th}>Bruto</th><th style={th}>Área m²</th><th style={th}>{aval.unidadeSaida}</th>
              </tr></thead>
              <tbody>
                {rel.linhas.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f8" }}>
                    <td style={td}>{l.parcela}</td><td style={td}>{l.tratamento}</td>
                    <td style={td}>{l.valorColetado ?? "—"}</td><td style={td}>{l.areaUtilM2 ?? "—"}</td>
                    <td style={td}><strong>{l.valorSaida != null ? Math.round(l.valorSaida) : "—"}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h4 style={{ margin: "0 0 8px" }}>Média por tratamento</h4>
            <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ color: "#7987A1", textAlign: "left" }}><th style={th}>Trat.</th><th style={th}>Nome</th><th style={th}>Média ({aval.unidadeSaida})</th></tr></thead>
              <tbody>
                {rel.medias.map((m) => (
                  <tr key={m.tratamento} style={{ borderBottom: "1px solid #f0f0f8" }}>
                    <td style={td}><strong>{m.tratamento}</strong></td><td style={td}>{m.nome}</td><td style={td}>{Math.round(m.media)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ color: "#a9abbd", fontSize: 11, marginTop: 8 }}>Médias simples (a análise estatística completa vem no Marco 4).</p>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 10px", fontSize: 12, fontWeight: 600 };
const td: React.CSSProperties = { padding: "6px 10px", fontSize: 13 };
const inp: React.CSSProperties = { padding: 6, borderRadius: 6, border: "1px solid #d6d6e6", fontSize: 13 };
function mini(bg: string): React.CSSProperties {
  return { background: bg, color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 };
}

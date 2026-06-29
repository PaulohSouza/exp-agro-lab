"use client";
import { useEffect, useMemo, useState } from "react";
import { api, type AnaliseResultado, type Avaliacao, type AvaliacaoDado, type EscopoModelo, type Experimento, type ModeloAvaliacao, type RelatorioAvaliacao } from "../../../lib/api";

const ESCOPO_INFO: Record<EscopoModelo, { sigla: string; label: string; cor: string }> = {
  sistema: { sigla: "GER", label: "Geral (sistema)", cor: "#1F2940" },
  instituicao: { sigla: "INST", label: "Instituição", cor: "#4EC2F0" },
  departamento: { sigla: "DEP", label: "Departamento", cor: "#C9B3F0" },
};

export function AvaliacoesTab({ exp, onChange }: { exp: Experimento; onChange: (e: Experimento) => void }) {
  const [modo, setModo] = useState<{ tipo: "lista" } | { tipo: "lancar"; aval: Avaliacao } | { tipo: "relatorio"; aval: Avaliacao } | { tipo: "analise"; aval: Avaliacao }>({ tipo: "lista" });
  const avaliacoes = exp.avaliacoes ?? [];

  async function recarregar() {
    onChange(await api.obter(exp.id));
  }

  if (modo.tipo === "lancar") return <Lancar exp={exp} aval={modo.aval} voltar={() => { setModo({ tipo: "lista" }); recarregar(); }} />;
  if (modo.tipo === "relatorio") return <Relatorio aval={modo.aval} voltar={() => setModo({ tipo: "lista" })} />;
  if (modo.tipo === "analise") return <Analise aval={modo.aval} voltar={() => setModo({ tipo: "lista" })} />;

  return (
    <div>
      <AdicionarDoCatalogo exp={exp} onAdicionou={recarregar} />
      <NovaAvaliacao exp={exp} onCriou={recarregar} />
      <div className="tabela-scroll"><table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
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
                <button onClick={() => setModo({ tipo: "analise", aval: a })} style={mini("#2D6CDF")}>Análise</button>{" "}
                <button onClick={async () => { await api.removerAvaliacao(a.id); recarregar(); }} style={mini("#F34343")}>x</button>
              </td>
            </tr>
          ))}
          {avaliacoes.length === 0 && <tr><td style={td} colSpan={7}><span style={{ color: "#a9abbd" }}>Nenhuma avaliação.</span></td></tr>}
        </tbody>
      </table></div>
    </div>
  );
}

function AdicionarDoCatalogo({ exp, onAdicionou }: { exp: Experimento; onAdicionou: () => void }) {
  const [modelos, setModelos] = useState<ModeloAvaliacao[]>([]);
  const [filtro, setFiltro] = useState<EscopoModelo | "todos">("todos");
  const [sel, setSel] = useState("");
  const [info, setInfo] = useState<ModeloAvaliacao | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => { api.listarModelos().then(setModelos).catch(() => {}); }, []);

  const visiveis = useMemo(
    () => (filtro === "todos" ? modelos : modelos.filter((m) => m.escopo === filtro)),
    [modelos, filtro],
  );
  const selModelo = modelos.find((m) => m.id === sel) ?? null;

  async function adicionar() {
    if (!sel) return;
    setMsg(null); setErro(null);
    try {
      const r = await api.adicionarAvaliacoesDoModelo(exp.id, [sel]);
      const nomes = r.criadas.map((a) => a.nome);
      let txt = nomes.length ? `Adicionada(s): ${nomes.join(", ")}.` : "Modelo já estava no experimento.";
      if (r.prerequisitosAdicionados.length) txt += ` Avaliação(ões) pré-requisito incluída(s): ${r.prerequisitosAdicionados.join(", ")}.`;
      if (r.atividadesAdicionadas.length) txt += ` Atividade(s) pré-requisito incluída(s) (ver aba Atividades): ${r.atividadesAdicionadas.join(", ")}.`;
      setMsg(txt);
      setSel("");
      onAdicionou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao adicionar do catálogo");
    }
  }

  if (modelos.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#eef6fc", padding: 12, borderRadius: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: "#1F2940", fontWeight: 600 }}>Adicionar do catálogo:</span>
      <select aria-label="Filtrar por escopo" value={filtro} onChange={(e) => { setFiltro(e.target.value as EscopoModelo | "todos"); setSel(""); }} style={inp}>
        <option value="todos">Todos os escopos</option>
        <option value="sistema">Geral (sistema)</option>
        <option value="instituicao">Instituição</option>
        <option value="departamento">Departamento</option>
      </select>
      <select data-testid="add-catalogo-select" value={sel} onChange={(e) => setSel(e.target.value)} style={{ ...inp, minWidth: 240 }}>
        <option value="">— escolher modelo —</option>
        {visiveis.map((m) => (
          <option key={m.id} value={m.id}>
            [{ESCOPO_INFO[m.escopo].sigla}] {m.nome}{m.unidadeSaida ? ` (${m.unidadeSaida})` : ""}
          </option>
        ))}
      </select>
      <button title="Ver metodologia" aria-label="Ver metodologia" disabled={!selModelo} onClick={() => setInfo(selModelo)} style={mini(selModelo ? "#4EC2F0" : "#a9abbd")}>ⓘ info</button>
      <button data-testid="add-catalogo-btn" onClick={adicionar} disabled={!sel} style={mini(sel ? "#1F2940" : "#a9abbd")}>adicionar</button>
      {msg && <span data-testid="add-catalogo-msg" style={{ fontSize: 12, color: "#1F2940" }}>{msg}</span>}
      {erro && <span style={{ fontSize: 12, color: "#F34343" }}>{erro}</span>}
      {info && <ModeloInfoModal modelo={info} onClose={() => setInfo(null)} />}
    </div>
  );
}

function ModeloInfoModal({ modelo, onClose }: { modelo: ModeloAvaliacao; onClose: () => void }) {
  const esc = ESCOPO_INFO[modelo.escopo];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,27,45,.55)", display: "grid", placeItems: "center", zIndex: 1000, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, maxWidth: 520, width: "100%", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.3)" }}>
        <div style={{ background: "#1F2940", color: "#fff", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <strong style={{ flex: 1 }}>{modelo.nome}</strong>
          <span style={{ background: esc.cor, color: modelo.escopo === "departamento" ? "#1F2940" : "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>{esc.label}</span>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 18, fontSize: 13, color: "#1F2940", display: "grid", gap: 10 }}>
          <Linha rotulo="Pontos amostrais" valor={String(modelo.numeroPontos)} />
          <Linha rotulo="Unidade" valor={`${modelo.unidadeColeta ?? "—"}${modelo.unidadeSaida ? ` → ${modelo.unidadeSaida}` : ""}`} />
          {modelo.calculoRelatorio && <Linha rotulo="Cálculo (relatório)" valor={modelo.calculoRelatorio} />}
          {modelo.prerequisitos && modelo.prerequisitos.length > 0 && (
            <Linha rotulo="Pré-requisitos (avaliações)" valor={modelo.prerequisitos.map((p) => p.prerequisito.nome).join(", ")} />
          )}
          {modelo.prerequisitosAtividade && modelo.prerequisitosAtividade.length > 0 && (
            <Linha rotulo="Pré-requisitos (atividades)" valor={modelo.prerequisitosAtividade.map((p) => p.modeloAtividade.nome).join(", ")} />
          )}
          <Bloco rotulo="Como coletar" texto={modelo.descricaoColeta} />
          <Bloco rotulo="Metodologia (relatório)" texto={modelo.metodologiaRelatorio} />
        </div>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return <div><span style={{ color: "#7987A1" }}>{rotulo}: </span><strong>{valor}</strong></div>;
}
function Bloco({ rotulo, texto }: { rotulo: string; texto?: string | null }) {
  return (
    <div>
      <div style={{ color: "#7987A1", marginBottom: 2 }}>{rotulo}:</div>
      <div style={{ whiteSpace: "pre-wrap" }}>{texto?.trim() ? texto : <span style={{ color: "#a9abbd" }}>— não informado —</span>}</div>
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button onClick={voltar} style={mini("#a9abbd")}>← voltar</button>
        <strong>Lançar: {aval.nome}</strong>
        <span style={{ color: "#7987A1", fontSize: 13 }}>valor bruto por parcela{usaArea ? " + apontamentos da colheita" : ""}</span>
        <button onClick={salvar} style={mini("#6FA830")}>Salvar</button>
        {msg && <span style={{ color: "#6FA830", fontSize: 13 }}>{msg}</span>}
      </div>
      <div className="tabela-scroll"><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
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
      </table></div>
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
            <div className="tabela-scroll"><table style={{ borderCollapse: "collapse", fontSize: 13 }}>
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
            </table></div>
          </div>
          <div>
            <h4 style={{ margin: "0 0 8px" }}>Média por tratamento</h4>
            <div className="tabela-scroll"><table style={{ borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ color: "#7987A1", textAlign: "left" }}><th style={th}>Trat.</th><th style={th}>Nome</th><th style={th}>Média ({aval.unidadeSaida})</th></tr></thead>
              <tbody>
                {rel.medias.map((m) => (
                  <tr key={m.tratamento} style={{ borderBottom: "1px solid #f0f0f8" }}>
                    <td style={td}><strong>{m.tratamento}</strong></td><td style={td}>{m.nome}</td><td style={td}>{Math.round(m.media)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <p style={{ color: "#a9abbd", fontSize: 11, marginTop: 8 }}>Médias simples (a análise estatística completa vem no Marco 4).</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Analise({ aval, voltar }: { aval: Avaliacao; voltar: () => void }) {
  const [a, setA] = useState<AnaliseResultado | null>(null);
  const [metodo, setMetodo] = useState<"Tukey" | "ScottKnott" | "LSD">("Tukey");
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    setA(null);
    api.analiseAvaliacao(aval.id, metodo).then(setA).catch((e) => setErro(e instanceof Error ? e.message : "falha"));
  }, [aval.id, metodo]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={voltar} style={mini("#a9abbd")}>← voltar</button>
        <strong>Análise: {aval.nome}</strong>
        <label style={{ marginLeft: "auto", fontSize: 13, color: "#1F2940" }}>
          Comparação:{" "}
          <select value={metodo} onChange={(e) => setMetodo(e.target.value as typeof metodo)} style={{ padding: 5, borderRadius: 6, border: "1px solid #d6d6e6" }}>
            <option value="Tukey">Tukey (HSD)</option>
            <option value="ScottKnott">Scott-Knott</option>
            <option value="LSD">LSD (Fisher)</option>
          </select>
        </label>
      </div>
      {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
      {!a ? (!erro && <p style={{ color: "#7987A1" }}>Calculando…</p>) : (
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div>
            <h4 style={{ margin: "0 0 8px" }}>ANOVA ({a.delineamento}, n={a.n})</h4>
            <div className="tabela-scroll"><table style={{ borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ color: "#7987A1", textAlign: "left" }}>
                <th style={th}>Fonte</th><th style={th}>GL</th><th style={th}>SQ</th><th style={th}>QM</th><th style={th}>F</th><th style={th}>p</th>
              </tr></thead>
              <tbody>
                {a.resultado.tabela.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f8" }}>
                    <td style={td}>{l.fonte}</td><td style={td}>{l.gl}</td>
                    <td style={td}>{l.sq.toFixed(2)}</td><td style={td}>{l.qm.toFixed(2)}</td>
                    <td style={td}>{l.f != null ? l.f.toFixed(2) : "—"}</td>
                    <td style={td}>{l.p != null ? (l.p < 0.001 ? "<0.001" : l.p.toFixed(3)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <p style={{ fontSize: 13, color: "#1F2940", marginTop: 8 }}>
              CV = <strong>{a.resultado.cv.toFixed(2)}%</strong> · média geral {a.resultado.mediaGeral.toFixed(1)} ·{" "}
              {a.resultado.significativo ? <span style={{ color: "#6FA830" }}>tratamento significativo</span> : <span style={{ color: "#F34343" }}>não significativo</span>}
            </p>
            <p style={{ fontSize: 12, color: "#7987A1" }}>
              Bartlett p = {a.resultado.pressupostos.bartlettP.toFixed(3)} ({a.resultado.pressupostos.homogeneo ? "homogêneo" : "heterogêneo"})
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 8px" }}>Médias — {a.resultado.comparacao.metodo}</h4>
            <div className="tabela-scroll"><table style={{ borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ color: "#7987A1", textAlign: "left" }}><th style={th}>Trat.</th><th style={th}>Média</th><th style={th}></th></tr></thead>
              <tbody>
                {a.resultado.medias.map((m) => (
                  <tr key={m.tratamento} style={{ borderBottom: "1px solid #f0f0f8" }}>
                    <td style={td}><strong>{m.tratamento}</strong></td>
                    <td style={td}>{m.media.toFixed(1)}</td>
                    <td style={{ ...td, fontWeight: 700, color: "#2D6CDF" }}>{m.letra}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <p style={{ color: "#a9abbd", fontSize: 11, marginTop: 8, maxWidth: 240 }}>
              Letras iguais = sem diferença significativa (α={a.resultado.comparacao.alpha}). Tukey/Scott-Knott/LSD portados do SAGRE; validação golden vs saída do R pendente.
            </p>
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

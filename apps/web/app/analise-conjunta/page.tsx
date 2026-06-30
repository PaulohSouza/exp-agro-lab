"use client";
import { useEffect, useState } from "react";
import { api, type Experimento, type ConjuntaResposta } from "../../lib/api";
import { Protected } from "../../components/Protected";

const th: React.CSSProperties = { padding: "8px 10px", fontSize: 12, fontWeight: 600 };
const td: React.CSSProperties = { padding: "6px 10px", fontSize: 13 };

export default function AnaliseConjuntaPage() {
  const [exps, setExps] = useState<Experimento[]>([]);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [nome, setNome] = useState("");
  const [res, setRes] = useState<ConjuntaResposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    api
      .listar()
      .then(setExps)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao listar"));
  }, []);

  const ids = Object.keys(sel).filter((k) => sel[k]);

  async function analisar() {
    setErro(null);
    setRes(null);
    if (ids.length < 2) {
      setErro("Selecione ao menos 2 experimentos (locais).");
      return;
    }
    if (!nome.trim()) {
      setErro("Informe o nome da avaliação (igual nos experimentos).");
      return;
    }
    setCarregando(true);
    try {
      setRes(await api.analiseConjunta(ids, nome.trim()));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na análise conjunta");
    } finally {
      setCarregando(false);
    }
  }

  const sig = (s: boolean) =>
    s ? (
      <span style={{ color: "#6FA830" }}>significativo</span>
    ) : (
      <span style={{ color: "#F34343" }}>n.s.</span>
    );

  return (
    <Protected>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <h2 style={{ color: "#1F2940" }}>Análise conjunta (multi-local)</h2>
        <p style={{ color: "#7987A1", fontSize: 14, maxWidth: 720 }}>
          Combina experimentos em blocos (DBC) com os mesmos tratamentos — cada experimento é um
          <strong> local</strong>. Modelo: Local + Bloco/Local + Tratamento + Local×Tratamento.
          Locais aleatórios ⇒ o tratamento é testado pela interação (G×A).
        </p>

        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginTop: 12 }}>
          <div style={{ minWidth: 280 }}>
            <h4 style={{ margin: "0 0 8px" }}>Experimentos (locais)</h4>
            <div
              className="tabela-scroll"
              style={{
                maxHeight: 320,
                overflow: "auto",
                border: "1px solid #e1e1ef",
                borderRadius: 6,
              }}
            >
              {exps.map((e) => (
                <label
                  key={e.id}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "6px 10px",
                    borderBottom: "1px solid #f0f0f8",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!sel[e.id]}
                    onChange={(ev) => setSel({ ...sel, [e.id]: ev.target.checked })}
                  />
                  <span>
                    <strong>{e.titulo}</strong>
                    {e.local?.nome ? (
                      <span style={{ color: "#7987A1" }}> · {e.local.nome}</span>
                    ) : null}
                  </span>
                </label>
              ))}
              {exps.length === 0 && (
                <div style={{ padding: 10, color: "#a9abbd", fontSize: 13 }}>
                  Nenhum experimento.
                </div>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 13, color: "#1F2940" }}>
                Avaliação:{" "}
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="ex.: Produtividade"
                  style={{ padding: 6, borderRadius: 6, border: "1px solid #d6d6e6", fontSize: 13 }}
                />
              </label>
            </div>
            <button
              onClick={analisar}
              disabled={carregando}
              style={{
                marginTop: 10,
                background: "#2D6CDF",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "7px 14px",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {carregando ? "Analisando…" : `Analisar (${ids.length} locais)`}
            </button>
            {erro && <p style={{ color: "#F34343", fontSize: 13 }}>{erro}</p>}
          </div>

          {res && (
            <div style={{ flex: 1, minWidth: 360 }}>
              <h4 style={{ margin: "0 0 8px" }}>
                {res.resultado.locais} locais × {res.resultado.blocos} blocos ×{" "}
                {res.resultado.tratamentos} tratamentos (n={res.n}) — {res.avaliacaoNome}
              </h4>
              <div className="tabela-scroll">
                <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#7987A1", textAlign: "left" }}>
                      {["Fonte", "GL", "SQ", "QM", "F", "p"].map((h) => (
                        <th key={h} style={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {res.resultado.tabela.map((l, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f0f8" }}>
                        <td style={td}>{l.fonte}</td>
                        <td style={td}>{l.gl}</td>
                        <td style={td}>{l.sq.toFixed(2)}</td>
                        <td style={td}>{l.qm != null ? l.qm.toFixed(2) : "—"}</td>
                        <td style={td}>{l.f != null && isFinite(l.f) ? l.f.toFixed(2) : "—"}</td>
                        <td style={td}>
                          {l.p != null && isFinite(l.p)
                            ? l.p < 0.001
                              ? "<0.001"
                              : l.p.toFixed(3)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 13, color: "#1F2940", marginTop: 8 }}>
                CV = <strong>{res.resultado.cv.toFixed(2)}%</strong> · Local{" "}
                {sig(res.resultado.fLocal.significativo)} · Tratamento{" "}
                {sig(res.resultado.fTratamento.significativo)} · Local×Trat{" "}
                {sig(res.resultado.fInteracao.significativo)}
              </p>
              <p style={{ fontSize: 12, color: res.resultado.homogeneo ? "#6FA830" : "#F3A33A" }}>
                Razão QM-resíduo entre locais = {res.resultado.razaoQMResiduo.toFixed(2)} (
                {res.resultado.homogeneo
                  ? "homogêneo — junção válida"
                  : "heterogêneo — junção questionável (regra ~7×)"}
                )
              </p>
              <h4 style={{ margin: "12px 0 6px" }}>
                Médias de tratamento — {res.resultado.comparacao.metodo}
              </h4>
              <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {res.resultado.medias.map((m) => (
                    <tr key={m.tratamento} style={{ borderBottom: "1px solid #f0f0f8" }}>
                      <td style={td}>
                        <strong>{m.tratamento}</strong>
                      </td>
                      <td style={td}>{m.media.toFixed(2)}</td>
                      <td style={{ ...td, fontWeight: 700, color: "#2D6CDF" }}>{m.letra}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "#a9abbd", fontSize: 11, marginTop: 8, maxWidth: 360 }}>
                Médias comparadas com o erro da interação Local×Tratamento (locais aleatórios). Port
                do SAGRE; golden vs R pendente.
              </p>
            </div>
          )}
        </div>
      </main>
    </Protected>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Dashboard, type Contagem } from "../../lib/api";
import { Protected } from "../../components/Protected";

const PAPEL_ROTULO: Record<string, string> = {
  admin_sistema: "Administrador do sistema",
  gestao_instituicao: "Gestão da instituição",
  gestao_departamento: "Gestão de departamento",
  coordenador_area: "Coordenador de área/laboratório",
  pesquisador: "Pesquisador",
  analista: "Analista",
  assistente: "Assistente",
};

export default function DashboardPage() {
  const [d, setD] = useState<Dashboard | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.dashboard().then(setD).catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"));
  }, []);

  return (
    <Protected>
      <main style={{ maxWidth: 1040, margin: "24px auto", padding: "0 20px" }}>
        <h1 style={{ color: "#1F2940", marginBottom: 4 }}>Painel de acompanhamento</h1>
        {d && (
          <p style={{ color: "#7987A1", marginTop: 0, fontSize: 13 }}>
            Visão: <strong>{PAPEL_ROTULO[d.escopo] ?? d.escopo}</strong>
          </p>
        )}
        {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
        {!d && !erro && <p style={{ color: "#7987A1" }}>Carregando…</p>}

        {d && (
          <>
            <section style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "12px 0 20px" }}>
              <KpiCard titulo="Experimentos" valor={d.totais.experimentos} cor="#1F2940" />
              <KpiCard titulo="Em condução" valor={d.totais.emConducao} cor="#6FA830" />
              <KpiCard titulo="Avaliações previstas" valor={d.checklist.previstas} cor="#4EC2F0" />
              <KpiCard titulo="Atrasadas" valor={d.checklist.atrasadas} cor="#F34343" />
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <Bloco titulo="Por status"><Barras dados={d.porStatus} /></Bloco>
              <Bloco titulo="Por local"><Barras dados={d.porLocal} /></Bloco>
              <Bloco titulo="Por área de pesquisa"><Barras dados={d.porArea} /></Bloco>
              <Bloco titulo="Por safra"><Barras dados={d.porSafra} /></Bloco>
            </div>

            <Bloco titulo="Checklist do ensaio (avaliações previstas × realizadas)">
              <p style={{ fontSize: 13, color: "#5A6B8C", marginTop: 0 }}>
                ✔ {d.checklist.realizadas} realizadas · ⏳ {d.checklist.pendentes} pendentes · ⚠ {d.checklist.atrasadas} atrasadas
                {d.checklist.previstas === 0 && " — nenhuma avaliação tem data prevista cadastrada ainda."}
              </p>
              {d.checklist.itens.length > 0 && (
                <div className="tabela-scroll">
                <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#7987A1" }}>
                      <th style={th}>Estado</th><th style={th}>Avaliação</th><th style={th}>Experimento</th><th style={th}>Prevista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.checklist.itens.map((i, idx) => (
                      <tr key={idx} style={{ borderTop: "1px solid #EEF1F6" }}>
                        <td style={td}>{i.estado === "atrasada" ? "⚠ atrasada" : "⏳ pendente"}</td>
                        <td style={td}>{i.avaliacao}</td>
                        <td style={td}>
                          <Link href={`/experimentos/${i.experimentoId}`} style={{ color: "#1F6FB0" }}>{i.experimento}</Link>
                        </td>
                        <td style={td}>{i.dataPrevista ? new Date(i.dataPrevista).toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </Bloco>
          </>
        )}
      </main>
    </Protected>
  );
}

function KpiCard({ titulo, valor, cor }: { titulo: string; valor: number; cor: string }) {
  return (
    <div style={{ flex: "1 1 160px", background: "#fff", borderRadius: 10, padding: 16, borderLeft: `4px solid ${cor}`, boxShadow: "0 1px 3px rgba(20,27,45,.08)" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: cor }}>{valor}</div>
      <div style={{ fontSize: 12, color: "#7987A1" }}>{titulo}</div>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", borderRadius: 10, padding: 16, marginTop: 16, boxShadow: "0 1px 3px rgba(20,27,45,.06)" }}>
      <h3 style={{ margin: "0 0 10px", color: "#1F2940", fontSize: 15 }}>{titulo}</h3>
      {children}
    </section>
  );
}

function Barras({ dados }: { dados: Contagem[] }) {
  if (!dados.length) return <p style={{ color: "#9BA7BD", fontSize: 13, margin: 0 }}>Sem dados.</p>;
  const max = Math.max(...dados.map((x) => x.n));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {dados.map((x) => (
        <div key={x.rotulo} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ width: 110, color: "#5A6B8C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.rotulo}</span>
          <div style={{ flex: 1, background: "#EEF3F9", borderRadius: 4 }}>
            <div style={{ width: `${(x.n / max) * 100}%`, background: "#4EC2F0", height: 16, borderRadius: 4 }} />
          </div>
          <strong style={{ width: 24, textAlign: "right", color: "#1F2940" }}>{x.n}</strong>
        </div>
      ))}
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 8px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "6px 8px", color: "#33405C" };

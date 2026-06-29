"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  api,
  baixarExperimentoXlsx,
  baixarRelatorioPptx,
  type Experimento,
} from "../../../lib/api";
import { CroquiEditor } from "./CroquiEditor";
import { TratamentosTab } from "./TratamentosTab";
import { AvaliacoesTab } from "./AvaliacoesTab";
import { AtividadesTab } from "./AtividadesTab";
import { GeralTab } from "./GeralTab";
import { FatoresTab } from "./FatoresTab";
import { CompartilharTab } from "./CompartilharTab";
import { OrdemServicoTab } from "./OrdemServicoTab";
import { Protected } from "../../../components/Protected";

const ABAS = [
  "Geral",
  "Fatores",
  "Tratamentos",
  "Croqui",
  "Avaliações",
  "Atividades",
  "Compartilhar",
  "Ordem de Serviço",
] as const;
type Aba = (typeof ABAS)[number];

export default function DetalheExperimento({ params }: { params: { id: string } }) {
  const [exp, setExp] = useState<Experimento | null>(null);
  const [aba, setAba] = useState<Aba>("Geral");
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    try {
      setExp(await api.obter(params.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar");
    }
  }
  useEffect(() => {
    recarregar();
  }, [params.id]);

  if (erro)
    return (
      <Wrap>
        <p style={{ color: "#F34343" }}>{erro}</p>
      </Wrap>
    );
  if (!exp)
    return (
      <Wrap>
        <p style={{ color: "#7987A1" }}>Carregando…</p>
      </Wrap>
    );

  return (
    <Wrap>
      <div
        style={{
          background: "#1F2940",
          color: "#fff",
          padding: "16px 20px",
          borderRadius: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Link href="/experimentos" style={{ color: "#4EC2F0", fontSize: 13 }}>
            ← Protocolos
          </Link>
          <h1 style={{ margin: "6px 0 0", fontSize: 22, overflowWrap: "anywhere" }}>
            {exp.codigo ? `${exp.codigo} — ` : ""}
            {exp.titulo}
          </h1>
          <span style={{ color: "#9BD2F5", fontSize: 13 }}>
            {exp.ensaio} • {exp.status}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => baixarExperimentoXlsx(exp.id, exp.codigo ?? exp.titulo)}
            style={{
              background: "#4EC2F0",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Excel
          </button>
          <button
            onClick={() => baixarRelatorioPptx(exp.id, `relatorio-${exp.codigo ?? exp.titulo}`)}
            style={{
              background: "#6FA830",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Relatório PPTX
          </button>
        </div>
      </div>

      <div
        className="scroll-x"
        style={{ display: "flex", gap: 4, borderBottom: "1px solid #e1e1ef", margin: "16px 0" }}
      >
        {ABAS.map((a) => (
          <button key={a} onClick={() => setAba(a)} style={tab(a === aba)}>
            {a}
          </button>
        ))}
      </div>

      {aba === "Geral" && (
        <Card>
          <GeralTab exp={exp} onChange={setExp} />
        </Card>
      )}

      {aba === "Fatores" && (
        <Card>
          <FatoresTab exp={exp} onChange={setExp} />
        </Card>
      )}

      {aba === "Tratamentos" && (
        <Card>
          <TratamentosTab exp={exp} onChange={setExp} />
        </Card>
      )}

      {aba === "Croqui" && (
        <Card>
          <CroquiEditor exp={exp} onChange={setExp} />
        </Card>
      )}

      {aba === "Avaliações" && (
        <Card>
          <AvaliacoesTab exp={exp} onChange={setExp} />
        </Card>
      )}

      {aba === "Atividades" && (
        <Card>
          <AtividadesTab exp={exp} />
        </Card>
      )}

      {aba === "Compartilhar" && (
        <Card>
          <CompartilharTab exp={exp} />
        </Card>
      )}

      {aba === "Ordem de Serviço" && (
        <Card>
          <OrdemServicoTab exp={exp} />
        </Card>
      )}
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <main style={{ maxWidth: 900, margin: "32px auto", padding: 24 }}>{children}</main>
    </Protected>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", borderRadius: 10, padding: 20 }}>{children}</div>;
}
function tab(isAtivo: boolean): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "10px 14px",
    color: isAtivo ? "#1F2940" : "#7987A1",
    fontWeight: isAtivo ? 700 : 400,
    borderBottom: isAtivo ? "2px solid #6FA830" : "2px solid transparent",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  };
}
function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
  };
}

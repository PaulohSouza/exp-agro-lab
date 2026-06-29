"use client";
import { useEffect, useState } from "react";
import { api, type Experimento, type OrdemServico } from "../../../lib/api";
import { getUser } from "../../../lib/auth";

const LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  AGUARDANDO_APROVACAO_INTERNA: "Aguardando aprovação interna",
  AGUARDANDO_APROVACAO_CLIENTE: "Aguardando aprovação do cliente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
};
const COR: Record<string, string> = {
  RASCUNHO: "#a9abbd",
  AGUARDANDO_APROVACAO_INTERNA: "#F3C17A",
  AGUARDANDO_APROVACAO_CLIENTE: "#4EC2F0",
  APROVADA: "#6FA830",
  RECUSADA: "#F34343",
};

export function OrdemServicoTab({ exp }: { exp: Experimento }) {
  const [lista, setLista] = useState<OrdemServico[]>([]);
  const [aprovadorIds, setAprovadorIds] = useState<Set<string>>(new Set());
  const [clienteEmail, setClienteEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const meId = getUser()?.id;

  async function recarregar() {
    try {
      setLista(await api.listarOS(exp.id));
      try {
        setAprovadorIds(new Set((await api.listarAprovadores()).map((a) => a.userId)));
      } catch {
        /* sem permissão de listar é ok */
      }
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha");
    }
  }
  useEffect(() => {
    recarregar();
  }, [exp.id]);

  async function criar() {
    await api.criarOS(exp.id);
    recarregar();
  }
  async function submeter(os: OrdemServico) {
    if (!clienteEmail.trim()) {
      setErro("Informe o e-mail do cliente.");
      return;
    }
    await api.submeterOS(os.id, clienteEmail.trim());
    setMsg("OS submetida. E-mail ao cliente é simulado (veja apps/api/email-previews).");
    setClienteEmail("");
    recarregar();
  }
  async function aprovar(os: OrdemServico, decisao: "APROVADO" | "RECUSADO") {
    await api.aprovarInternoOS(os.id, decisao);
    recarregar();
  }

  if (exp.ensaio !== "COMERCIAL") {
    return (
      <p style={{ color: "#7987A1" }}>
        Ordem de Serviço aplica-se ao fluxo <strong>comercial</strong>. Mude o ensaio na aba Geral
        para usar.
      </p>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={{ color: "#7987A1", fontSize: 13 }}>
          Fluxo comercial: aprovação interna (política da instituição) + aprovação do cliente por
          e-mail.
        </span>
        <button onClick={criar} style={btn("#6FA830")}>
          Nova OS
        </button>
      </div>
      {msg && <p style={{ color: "#6FA830", fontSize: 13 }}>{msg}</p>}
      {erro && <p style={{ color: "#F34343", fontSize: 13 }}>{erro}</p>}

      {lista.length === 0 && <p style={{ color: "#a9abbd" }}>Nenhuma OS ainda.</p>}
      {lista.map((os) => (
        <div
          key={os.id}
          style={{ border: "1px solid #e1e1ef", borderRadius: 10, padding: 16, marginBottom: 12 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                background: COR[os.status],
                color: "#fff",
                padding: "3px 10px",
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {LABEL[os.status] ?? os.status}
            </span>
            <code style={{ color: "#7987A1", fontSize: 12 }}>{os.id.slice(-6)}</code>
          </div>

          {(os.status === "RASCUNHO" || os.status === "RECUSADA") && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                placeholder="e-mail do cliente"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                style={inp}
              />
              <button onClick={() => submeter(os)} style={btn("#4EC2F0")}>
                Submeter p/ aprovação
              </button>
            </div>
          )}

          {os.status === "AGUARDANDO_APROVACAO_INTERNA" && meId && aprovadorIds.has(meId) && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => aprovar(os, "APROVADO")} style={btn("#6FA830")}>
                Aprovar (interno)
              </button>
              <button onClick={() => aprovar(os, "RECUSADO")} style={btn("#F34343")}>
                Recusar
              </button>
            </div>
          )}

          {os.aprovacoesInternas.length > 0 && (
            <p style={{ fontSize: 13, marginTop: 10, color: "#1F2940" }}>
              Aprovações internas: {os.aprovacoesInternas.map((a) => a.decisao).join(", ")}
            </p>
          )}
          {os.aprovacaoCliente && (
            <p style={{ fontSize: 13, color: "#1F2940" }}>
              Cliente: {os.aprovacaoCliente.clienteEmail} —{" "}
              <strong>{os.aprovacaoCliente.decisao}</strong>
              {os.status === "AGUARDANDO_APROVACAO_CLIENTE" && (
                <a
                  href={`/aprovacao/${os.aprovacaoCliente.token}`}
                  target="_blank"
                  style={{ color: "#2D6CDF", marginLeft: 8 }}
                >
                  abrir link de aprovação (simulado) →
                </a>
              )}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  border: "1px solid #d6d6e6",
  minWidth: 220,
};
function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
  };
}

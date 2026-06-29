"use client";
import { useState } from "react";
import { decisaoCliente } from "../../../lib/api";

export default function AprovacaoPage({ params }: { params: { token: string } }) {
  const [resultado, setResultado] = useState<{ decisao: string; experimento: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);

  async function decidir(decisao: "aprovado" | "recusado") {
    setBusy(true);
    setErro(null);
    try {
      const r = await decisaoCliente(params.token, decisao, motivo || undefined);
      setResultado({ decisao: r.decisao, experimento: r.experimento });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar a decisão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#141B2D" }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          width: "100%",
          maxWidth: 420,
          margin: "0 16px",
        }}
      >
        <h1 style={{ margin: "0 0 4px", color: "#1F2940" }}>Aprovação de Ordem de Serviço</h1>
        {resultado ? (
          <div>
            <p style={{ color: "#1F2940" }}>
              Experimento: <strong>{resultado.experimento}</strong>
            </p>
            <p
              style={{
                color: resultado.decisao === "aprovado" ? "#6FA830" : "#F34343",
                fontWeight: 600,
              }}
            >
              Decisão registrada: {resultado.decisao}.
            </p>
            <p style={{ color: "#7987A1", fontSize: 13 }}>Você pode fechar esta página.</p>
          </div>
        ) : (
          <div>
            <p style={{ color: "#7987A1", fontSize: 14 }}>
              Revise e registre sua decisão sobre a OS.
            </p>
            <textarea
              placeholder="Observação (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{
                width: "100%",
                minHeight: 60,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d6d6e6",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={busy}
                onClick={() => decidir("aprovado")}
                style={{
                  flex: 1,
                  background: "#6FA830",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px",
                  cursor: "pointer",
                }}
              >
                Aprovar
              </button>
              <button
                disabled={busy}
                onClick={() => decidir("recusado")}
                style={{
                  flex: 1,
                  background: "#F34343",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px",
                  cursor: "pointer",
                }}
              >
                Recusar
              </button>
            </div>
            {erro && <p style={{ color: "#F34343", fontSize: 13 }}>{erro}</p>}
          </div>
        )}
      </div>
    </main>
  );
}

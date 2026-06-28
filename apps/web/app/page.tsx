async function getHealth(): Promise<{ status: string; db: string } | null> {
  try {
    const r = await fetch("http://localhost:3001/health", { cache: "no-store" });
    return await r.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealth();
  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
      <div style={{ background: "#1F2940", color: "#fff", padding: "20px 24px", borderRadius: 10 }}>
        <h1 style={{ margin: 0 }}>EXP-AGROLAB</h1>
        <p style={{ margin: "8px 0 0", color: "#4EC2F0" }}>
          Gestão de experimentos agronômicos e laboratoriais
        </p>
      </div>

      <section style={{ marginTop: 24, background: "#fff", borderRadius: 10, padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Marco 0 — fundação</h2>
        <p>
          Status da API:{" "}
          <strong style={{ color: health?.db === "up" ? "#6FA830" : "#F34343" }}>
            {health ? `${health.status} · db ${health.db}` : "API offline"}
          </strong>
        </p>
        <p style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <a href="/login" style={{ background: "#1F2940", color: "#fff", padding: "10px 16px", borderRadius: 8, textDecoration: "none" }}>
            Entrar →
          </a>
          <a href="/experimentos" style={{ background: "#6FA830", color: "#fff", padding: "10px 16px", borderRadius: 8, textDecoration: "none" }}>
            Protocolos / Experimentos →
          </a>
        </p>
        <p style={{ color: "#7987A1" }}>
          Marco 1: experimento (Geral · Fatores · Tratamentos) + editor de croqui clique-e-arraste.
        </p>
      </section>
    </main>
  );
}

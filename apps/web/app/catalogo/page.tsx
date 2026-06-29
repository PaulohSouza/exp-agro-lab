"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  api,
  type Departamento,
  type EscopoModelo,
  type GrupoColeta,
  type GrupoColetaInput,
  type ModeloAvaliacao,
  type ModeloAvaliacaoInput,
  type ModeloAtividade,
  type ModeloAtividadeInput,
  type Papel,
  type TipoCampo,
} from "../../lib/api";
import { Protected } from "../../components/Protected";
import { getUser } from "../../lib/auth";

const ESCOPOS: { value: EscopoModelo; label: string; cor: string }[] = [
  { value: "sistema", label: "Geral (sistema)", cor: "#1F2940" },
  { value: "instituicao", label: "Instituição", cor: "#4EC2F0" },
  { value: "departamento", label: "Departamento", cor: "#C9B3F0" },
];

function siglaEscopo(escopo: EscopoModelo): string {
  return ESCOPOS.find((e) => e.value === escopo)!.label.slice(0, 4);
}

/** Seletor múltiplo amigável: adiciona via dropdown, remove via chip "×". */
function MultiPicker({
  label,
  opcoes,
  selecionados,
  onChange,
  testid,
}: {
  label: string;
  opcoes: { id: string; rotulo: string }[];
  selecionados: string[];
  onChange: (ids: string[]) => void;
  testid?: string;
}) {
  const rotuloDe = new Map(opcoes.map((o) => [o.id, o.rotulo]));
  const disponiveis = opcoes.filter((o) => !selecionados.includes(o.id));
  return (
    <div>
      <div style={{ fontSize: 12, color: "#7987A1", marginBottom: 4 }}>{label}</div>
      <select
        data-testid={testid}
        value=""
        onChange={(e) => {
          if (e.target.value) onChange([...selecionados, e.target.value]);
        }}
        style={{ ...inp, width: "100%" }}
      >
        <option value="">+ adicionar…</option>
        {disponiveis.map((o) => (
          <option key={o.id} value={o.id}>
            {o.rotulo}
          </option>
        ))}
      </select>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
        {selecionados.length === 0 && (
          <span style={{ fontSize: 12, color: "#a9abbd" }}>nenhum</span>
        )}
        {selecionados.map((id) => (
          <span
            key={id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#e3eef7",
              border: "1px solid #cfe0ef",
              borderRadius: 14,
              padding: "2px 6px 2px 10px",
              fontSize: 12,
              color: "#1F2940",
            }}
          >
            {rotuloDe.get(id) ?? id}
            <button
              type="button"
              aria-label={`Remover ${rotuloDe.get(id) ?? id}`}
              onClick={() => onChange(selecionados.filter((x) => x !== id))}
              style={{
                background: "#1F2940",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 16,
                height: 16,
                lineHeight: "16px",
                cursor: "pointer",
                fontSize: 11,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Espelho da regra do domínio `podeGerenciarEscopo` (UI só; API valida de fato). */
function podeGerenciar(papel: Papel | undefined, escopo: EscopoModelo): boolean {
  if (papel === "admin_sistema") return true;
  if (papel === "gestao_instituicao") return escopo === "instituicao" || escopo === "departamento";
  if (papel === "gestao_departamento" || papel === "coordenador_area")
    return escopo === "departamento";
  return false;
}

const VAZIO: ModeloAvaliacaoInput = {
  nome: "",
  descricaoColeta: "",
  numeroPontos: 1,
  metodologiaRelatorio: "",
  unidadeColeta: "",
  unidadeSaida: "",
  calculoRelatorio: "",
  escopo: "instituicao",
  departamentoId: "",
  prerequisitoIds: [],
  prerequisitoAtividadeIds: [],
};

export default function CatalogoPage() {
  const [vista, setVista] = useState<"avaliacoes" | "atividades" | "grupos">("avaliacoes");
  return (
    <Protected>
      <main style={{ maxWidth: 1100, margin: "32px auto", padding: 24 }}>
        <div
          style={{ background: "#1F2940", color: "#fff", padding: "16px 20px", borderRadius: 10 }}
        >
          <Link href="/cadastros" style={{ color: "#4EC2F0", fontSize: 13 }}>
            ← Cadastros
          </Link>
          <h1 style={{ margin: "6px 0 0", fontSize: 22 }}>Catálogo</h1>
          <p style={{ margin: "6px 0 0", color: "#9BD2F5", fontSize: 13 }}>
            Modelos reutilizáveis por escopo (sistema / instituição / departamento). Avaliações são
            coletadas por parcela; atividades são registros gerais do experimento.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setVista("avaliacoes")} style={subtab(vista === "avaliacoes")}>
              Avaliações
            </button>
            <button onClick={() => setVista("atividades")} style={subtab(vista === "atividades")}>
              Atividades
            </button>
            <button onClick={() => setVista("grupos")} style={subtab(vista === "grupos")}>
              Grupos de coleta
            </button>
          </div>
        </div>
        {vista === "avaliacoes" ? (
          <Catalogo />
        ) : vista === "atividades" ? (
          <CatalogoAtividades />
        ) : (
          <CatalogoGrupos />
        )}
      </main>
    </Protected>
  );
}

function subtab(on: boolean): React.CSSProperties {
  return {
    background: on ? "#4EC2F0" : "transparent",
    color: on ? "#1F2940" : "#cfe6f7",
    border: "1px solid #4EC2F0",
    borderRadius: 8,
    padding: "5px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: on ? 600 : 400,
  };
}

function Catalogo() {
  const user = getUser();
  const papel = user?.papel;
  const [modelos, setModelos] = useState<ModeloAvaliacao[]>([]);
  const [modelosAtividade, setModelosAtividade] = useState<ModeloAtividade[]>([]);
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
    api
      .listarModelosAtividade()
      .then(setModelosAtividade)
      .catch(() => {});
    if (podeGerenciar(papel, "departamento"))
      api
        .departamentos()
        .then(setDepartamentos)
        .catch(() => {});
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
    setErro(null);
    setMsg(null);
    if (!form.nome.trim()) return;
    try {
      const body: ModeloAvaliacaoInput = {
        ...form,
        numeroPontos: Number(form.numeroPontos) || 1,
        departamentoId:
          form.escopo === "departamento" ? form.departamentoId || undefined : undefined,
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
      nome: m.nome,
      descricaoColeta: m.descricaoColeta ?? "",
      numeroPontos: m.numeroPontos,
      metodologiaRelatorio: m.metodologiaRelatorio ?? "",
      unidadeColeta: m.unidadeColeta ?? "",
      unidadeSaida: m.unidadeSaida ?? "",
      calculoRelatorio: m.calculoRelatorio ?? "",
      escopo: m.escopo,
      departamentoId: m.departamentoId ?? "",
      prerequisitoIds: m.prerequisitos?.map((p) => p.prerequisitoId) ?? [],
      prerequisitoAtividadeIds: m.prerequisitosAtividade?.map((p) => p.modeloAtividadeId) ?? [],
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(m: ModeloAvaliacao) {
    if (!confirm(`Remover o modelo "${m.nome}"?`)) return;
    try {
      await api.removerModelo(m.id);
      recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao remover");
    }
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
        <form
          onSubmit={salvar}
          style={{ background: "#f9f9fb", padding: 16, borderRadius: 10, marginBottom: 20 }}
        >
          <strong style={{ color: "#1F2940" }}>{editId ? "Editar modelo" : "Novo modelo"}</strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginTop: 10,
            }}
          >
            <input
              data-testid="modelo-nome"
              placeholder="Nome (ex.: Altura de plantas)"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              style={inp}
            />
            <input
              type="number"
              min={1}
              placeholder="nº de pontos"
              value={form.numeroPontos}
              onChange={(e) => setForm({ ...form, numeroPontos: Number(e.target.value) })}
              style={inp}
            />
            <input
              placeholder="unid. coleta (ex.: kg)"
              value={form.unidadeColeta}
              onChange={(e) => setForm({ ...form, unidadeColeta: e.target.value })}
              style={inp}
            />
            <input
              placeholder="unid. saída (ex.: sacas/ha)"
              value={form.unidadeSaida}
              onChange={(e) => setForm({ ...form, unidadeSaida: e.target.value })}
              style={inp}
            />
            <input
              placeholder="cálculo p/ relatório (fórmula)"
              value={form.calculoRelatorio}
              onChange={(e) => setForm({ ...form, calculoRelatorio: e.target.value })}
              style={inp}
            />
            <select
              data-testid="modelo-escopo"
              value={form.escopo}
              onChange={(e) => setForm({ ...form, escopo: e.target.value as EscopoModelo })}
              style={inp}
              disabled={!!editId}
            >
              {escoposGerenciaveis.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
            {form.escopo === "departamento" && (
              <select
                value={form.departamentoId}
                onChange={(e) => setForm({ ...form, departamentoId: e.target.value })}
                style={inp}
              >
                <option value="">— departamento —</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
          <textarea
            placeholder="Descrição da coleta (como será feita)"
            value={form.descricaoColeta}
            onChange={(e) => setForm({ ...form, descricaoColeta: e.target.value })}
            style={{ ...inp, width: "100%", marginTop: 10, minHeight: 48 }}
          />
          <textarea
            placeholder="Metodologia p/ relatório (base para a IA redigir)"
            value={form.metodologiaRelatorio}
            onChange={(e) => setForm({ ...form, metodologiaRelatorio: e.target.value })}
            style={{ ...inp, width: "100%", marginTop: 10, minHeight: 48 }}
          />

          {/* pré-requisitos: dois pickers (avaliações + atividades) — adicionar via dropdown, remover via chip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
              marginTop: 12,
            }}
          >
            <MultiPicker
              testid="prereq-aval"
              label="Pré-requisitos — avaliações (coletadas junto):"
              opcoes={modelos
                .filter((m) => m.id !== editId)
                .map((m) => ({ id: m.id, rotulo: `[${siglaEscopo(m.escopo)}] ${m.nome}` }))}
              selecionados={form.prerequisitoIds ?? []}
              onChange={(ids) => setForm({ ...form, prerequisitoIds: ids })}
            />
            <MultiPicker
              testid="prereq-atv"
              label="Pré-requisitos — atividades (ex.: Colheita):"
              opcoes={modelosAtividade.map((m) => ({
                id: m.id,
                rotulo: `[${siglaEscopo(m.escopo)}] ${m.nome}${m.tipo === "apontamento" ? " (apont.)" : ""}`,
              }))}
              selecionados={form.prerequisitoAtividadeIds ?? []}
              onChange={(ids) => setForm({ ...form, prerequisitoAtividadeIds: ids })}
            />
          </div>
          <div style={{ fontSize: 11, color: "#a9abbd", marginTop: 4 }}>
            Ao adicionar a avaliação a um experimento, os pré-requisitos faltantes (avaliações e
            atividades) são incluídos automaticamente.
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" data-testid="modelo-salvar" style={btn("#1F2940")}>
              {editId ? "Salvar" : "Criar modelo"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({ ...VAZIO, escopo: escoposGerenciaveis[0]?.value ?? "instituicao" });
                }}
                style={btn("#a9abbd")}
              >
                cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* tabela */}
      <div className="tabela-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
              {[
                "Avaliação",
                "Escopo",
                "Pontos",
                "Coleta → Saída",
                "Pré-requisitos",
                "Usos",
                "Ações",
              ].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((m) => {
              const podeEditar = podeGerenciar(papel, m.escopo);
              const esc = ESCOPOS.find((e) => e.value === m.escopo)!;
              return (
                <tr key={m.id} style={{ borderBottom: "1px solid #eaecf3" }}>
                  <td style={td}>
                    <strong>{m.nome}</strong>
                    {m.descricaoColeta ? (
                      <div style={{ fontSize: 11, color: "#7987A1" }}>{m.descricaoColeta}</div>
                    ) : null}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        background: esc.cor,
                        color: esc.value === "departamento" ? "#1F2940" : "#fff",
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontSize: 11,
                      }}
                    >
                      {esc.label}
                    </span>
                  </td>
                  <td style={td}>{m.numeroPontos}</td>
                  <td style={td}>
                    {m.unidadeColeta ?? "—"}
                    {m.unidadeSaida ? ` → ${m.unidadeSaida}` : ""}
                  </td>
                  <td style={td}>
                    {m.prerequisitos?.length
                      ? m.prerequisitos.map((p) => p.prerequisito.nome).join(", ")
                      : null}
                    {m.prerequisitosAtividade?.length ? (
                      <div style={{ fontSize: 11, color: "#7987A1" }}>
                        atividades:{" "}
                        {m.prerequisitosAtividade.map((p) => p.modeloAtividade.nome).join(", ")}
                      </div>
                    ) : null}
                    {!m.prerequisitos?.length && !m.prerequisitosAtividade?.length ? "—" : null}
                  </td>
                  <td style={td}>{m._count?.avaliacoes ?? 0}</td>
                  <td style={td}>
                    {podeEditar ? (
                      <>
                        <button onClick={() => editar(m)} style={mini("#4EC2F0")}>
                          editar
                        </button>{" "}
                        <button onClick={() => excluir(m)} style={mini("#F34343")}>
                          x
                        </button>
                      </>
                    ) : (
                      <span style={{ color: "#a9abbd", fontSize: 12 }}>leitura</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr>
                <td style={td} colSpan={7}>
                  <span style={{ color: "#a9abbd" }}>Nenhum modelo neste escopo.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------------------------- Catálogo de atividades ----------------------------- */

interface CampoForm {
  rotulo: string;
  tipo: TipoCampo;
  unidade: string;
  isObrigatorio: boolean;
}
const ATV_VAZIO: ModeloAtividadeInput & { camposForm: CampoForm[] } = {
  nome: "",
  descricao: "",
  tipo: "acao",
  metodologiaRelatorio: "",
  escopo: "instituicao",
  departamentoId: "",
  camposForm: [],
};

function CatalogoAtividades() {
  const papel = getUser()?.papel;
  const [modelos, setModelos] = useState<ModeloAtividade[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [filtro, setFiltro] = useState<EscopoModelo | "todos">("todos");
  const [form, setForm] = useState<ModeloAtividadeInput & { camposForm: CampoForm[] }>(ATV_VAZIO);
  const [editId, setEditId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const escoposGerenciaveis = ESCOPOS.filter((e) => podeGerenciar(papel, e.value));

  async function recarregar() {
    setModelos(await api.listarModelosAtividade());
  }
  useEffect(() => {
    recarregar().catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"));
    if (podeGerenciar(papel, "departamento"))
      api
        .departamentos()
        .then(setDepartamentos)
        .catch(() => {});
    setForm((f) => ({ ...f, escopo: escoposGerenciaveis[0]?.value ?? "instituicao" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visiveis = useMemo(
    () => (filtro === "todos" ? modelos : modelos.filter((m) => m.escopo === filtro)),
    [modelos, filtro],
  );

  function reset() {
    setForm({ ...ATV_VAZIO, escopo: escoposGerenciaveis[0]?.value ?? "instituicao" });
    setEditId(null);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    if (!form.nome.trim()) return;
    try {
      const body: ModeloAtividadeInput = {
        nome: form.nome,
        descricao: form.descricao,
        tipo: form.tipo,
        metodologiaRelatorio: form.metodologiaRelatorio,
        escopo: form.escopo,
        departamentoId:
          form.escopo === "departamento" ? form.departamentoId || undefined : undefined,
        campos:
          form.tipo === "apontamento"
            ? form.camposForm
                .filter((c) => c.rotulo.trim())
                .map((c, i) => ({ ...c, unidade: c.unidade || undefined, ordem: i }))
            : [],
      };
      if (editId) await api.atualizarModeloAtividade(editId, body);
      else await api.criarModeloAtividade(body);
      setMsg(editId ? "Atividade atualizada." : "Atividade criada.");
      reset();
      recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  function editar(m: ModeloAtividade) {
    setEditId(m.id);
    setForm({
      nome: m.nome,
      descricao: m.descricao ?? "",
      tipo: m.tipo,
      metodologiaRelatorio: m.metodologiaRelatorio ?? "",
      escopo: m.escopo,
      departamentoId: m.departamentoId ?? "",
      camposForm: (m.campos ?? []).map((c) => ({
        rotulo: c.rotulo,
        tipo: c.tipo,
        unidade: c.unidade ?? "",
        isObrigatorio: c.isObrigatorio,
      })),
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(m: ModeloAtividade) {
    if (!confirm(`Remover a atividade "${m.nome}"?`)) return;
    try {
      await api.removerModeloAtividade(m.id);
      recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao remover");
    }
  }

  function setCampo(i: number, patch: Partial<CampoForm>) {
    setForm({
      ...form,
      camposForm: form.camposForm.map((c, j) => (j === i ? { ...c, ...patch } : c)),
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, margin: "20px 0 12px", flexWrap: "wrap" }}>
        {(["todos", "sistema", "instituicao", "departamento"] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)} style={chip(filtro === f)}>
            {f === "todos" ? "Todos" : ESCOPOS.find((e) => e.value === f)!.label}
          </button>
        ))}
      </div>

      {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
      {msg && <p style={{ color: "#1F2940" }}>{msg}</p>}

      {escoposGerenciaveis.length > 0 && (
        <form
          onSubmit={salvar}
          style={{ background: "#f9f9fb", padding: 16, borderRadius: 10, marginBottom: 20 }}
        >
          <strong style={{ color: "#1F2940" }}>
            {editId ? "Editar atividade" : "Nova atividade"}
          </strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginTop: 10,
            }}
          >
            <input
              data-testid="atv-nome"
              placeholder="Nome (ex.: Aplicação via CO2)"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              style={inp}
            />
            <select
              data-testid="atv-tipo"
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as ModeloAtividade["tipo"] })
              }
              style={inp}
            >
              <option value="acao">ação (sem coleta)</option>
              <option value="apontamento">com apontamento</option>
            </select>
            <select
              data-testid="atv-escopo"
              value={form.escopo}
              onChange={(e) => setForm({ ...form, escopo: e.target.value as EscopoModelo })}
              style={inp}
              disabled={!!editId}
            >
              {escoposGerenciaveis.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
            {form.escopo === "departamento" && (
              <select
                value={form.departamentoId}
                onChange={(e) => setForm({ ...form, departamentoId: e.target.value })}
                style={inp}
              >
                <option value="">— departamento —</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
          <textarea
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            style={{ ...inp, width: "100%", marginTop: 10, minHeight: 40 }}
          />
          <textarea
            placeholder="Metodologia p/ relatório (base para a IA)"
            value={form.metodologiaRelatorio}
            onChange={(e) => setForm({ ...form, metodologiaRelatorio: e.target.value })}
            style={{ ...inp, width: "100%", marginTop: 10, minHeight: 40 }}
          />

          {form.tipo === "apontamento" && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#7987A1", marginBottom: 6 }}>
                Campos do apontamento (parametrizados):
              </div>
              {form.camposForm.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 6,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <input
                    placeholder="rótulo"
                    value={c.rotulo}
                    onChange={(e) => setCampo(i, { rotulo: e.target.value })}
                    style={{ ...inp, width: 140 }}
                  />
                  <select
                    value={c.tipo}
                    onChange={(e) => setCampo(i, { tipo: e.target.value as TipoCampo })}
                    style={inp}
                  >
                    <option value="numero">número</option>
                    <option value="texto">texto</option>
                    <option value="data">data</option>
                    <option value="booleano">sim/não</option>
                  </select>
                  <input
                    placeholder="unidade"
                    value={c.unidade}
                    onChange={(e) => setCampo(i, { unidade: e.target.value })}
                    style={{ ...inp, width: 90 }}
                  />
                  <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={c.isObrigatorio}
                      onChange={(e) => setCampo(i, { isObrigatorio: e.target.checked })}
                    />{" "}
                    obrigatório
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, camposForm: form.camposForm.filter((_, j) => j !== i) })
                    }
                    style={mini("#F34343")}
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    camposForm: [
                      ...form.camposForm,
                      { rotulo: "", tipo: "numero", unidade: "", isObrigatorio: false },
                    ],
                  })
                }
                style={mini("#4EC2F0")}
              >
                + campo
              </button>
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" data-testid="atv-salvar" style={btn("#1F2940")}>
              {editId ? "Salvar" : "Criar atividade"}
            </button>
            {editId && (
              <button type="button" onClick={reset} style={btn("#a9abbd")}>
                cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="tabela-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
              {["Atividade", "Escopo", "Tipo", "Campos", "Usos", "Ações"].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((m) => {
              const podeEditar = podeGerenciar(papel, m.escopo);
              const esc = ESCOPOS.find((e) => e.value === m.escopo)!;
              return (
                <tr key={m.id} style={{ borderBottom: "1px solid #eaecf3" }}>
                  <td style={td}>
                    <strong>{m.nome}</strong>
                    {m.descricao ? (
                      <div style={{ fontSize: 11, color: "#7987A1" }}>{m.descricao}</div>
                    ) : null}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        background: esc.cor,
                        color: esc.value === "departamento" ? "#1F2940" : "#fff",
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontSize: 11,
                      }}
                    >
                      {esc.label}
                    </span>
                  </td>
                  <td style={td}>{m.tipo === "apontamento" ? "apontamento" : "ação"}</td>
                  <td style={td}>
                    {m.tipo === "apontamento"
                      ? (m.campos ?? []).map((c) => c.rotulo).join(", ") || "—"
                      : "—"}
                  </td>
                  <td style={td}>{m._count?.atividades ?? 0}</td>
                  <td style={td}>
                    {podeEditar ? (
                      <>
                        <button onClick={() => editar(m)} style={mini("#4EC2F0")}>
                          editar
                        </button>{" "}
                        <button onClick={() => excluir(m)} style={mini("#F34343")}>
                          x
                        </button>
                      </>
                    ) : (
                      <span style={{ color: "#a9abbd", fontSize: 12 }}>leitura</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr>
                <td style={td} colSpan={6}>
                  <span style={{ color: "#a9abbd" }}>Nenhuma atividade neste escopo.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------------------------- Grupos de coleta ----------------------------- */

function CatalogoGrupos() {
  const papel = getUser()?.papel;
  const escoposGerenciaveis = ESCOPOS.filter((e) => podeGerenciar(papel, e.value));
  const [grupos, setGrupos] = useState<GrupoColeta[]>([]);
  const [modelos, setModelos] = useState<ModeloAvaliacao[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [form, setForm] = useState<GrupoColetaInput>({
    nome: "",
    descricao: "",
    escopo: "instituicao",
    departamentoId: "",
    modeloIds: [],
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function recarregar() {
    setGrupos(await api.listarGrupos());
  }
  useEffect(() => {
    recarregar().catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"));
    api
      .listarModelos()
      .then(setModelos)
      .catch(() => {});
    if (podeGerenciar(papel, "departamento"))
      api
        .departamentos()
        .then(setDepartamentos)
        .catch(() => {});
    setForm((f) => ({ ...f, escopo: escoposGerenciaveis[0]?.value ?? "instituicao" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setForm({
      nome: "",
      descricao: "",
      escopo: escoposGerenciaveis[0]?.value ?? "instituicao",
      departamentoId: "",
      modeloIds: [],
    });
    setEditId(null);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    if (!form.nome.trim()) return;
    try {
      const body: GrupoColetaInput = {
        ...form,
        departamentoId:
          form.escopo === "departamento" ? form.departamentoId || undefined : undefined,
      };
      if (editId) await api.atualizarGrupo(editId, body);
      else await api.criarGrupo(body);
      setMsg(editId ? "Grupo atualizado." : "Grupo criado.");
      reset();
      recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  function editar(g: GrupoColeta) {
    setEditId(g.id);
    setForm({
      nome: g.nome,
      descricao: g.descricao ?? "",
      escopo: g.escopo,
      departamentoId: g.departamentoId ?? "",
      modeloIds: g.itens?.map((i) => i.modeloId) ?? [],
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(g: GrupoColeta) {
    if (!confirm(`Remover o grupo "${g.nome}"?`)) return;
    try {
      await api.removerGrupo(g.id);
      recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha");
    }
  }

  return (
    <div>
      <p style={{ color: "#7987A1", fontSize: 13, marginTop: 16 }}>
        Conjuntos nomeados de avaliações coletadas juntas (ex.: "Colheita" = Umidade + PMG +
        Produtividade). Aplique a um experimento na aba Avaliações.
      </p>
      {erro && <p style={{ color: "#F34343" }}>{erro}</p>}
      {msg && <p style={{ color: "#1F2940" }}>{msg}</p>}

      {escoposGerenciaveis.length > 0 && (
        <form
          onSubmit={salvar}
          style={{ background: "#f9f9fb", padding: 16, borderRadius: 10, marginBottom: 20 }}
        >
          <strong style={{ color: "#1F2940" }}>{editId ? "Editar grupo" : "Novo grupo"}</strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginTop: 10,
            }}
          >
            <input
              data-testid="grupo-nome"
              placeholder="Nome (ex.: Colheita)"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              style={inp}
            />
            <input
              placeholder="descrição"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              style={inp}
            />
            <select
              data-testid="grupo-escopo"
              value={form.escopo}
              onChange={(e) => setForm({ ...form, escopo: e.target.value as EscopoModelo })}
              style={inp}
              disabled={!!editId}
            >
              {escoposGerenciaveis.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
            {form.escopo === "departamento" && (
              <select
                value={form.departamentoId}
                onChange={(e) => setForm({ ...form, departamentoId: e.target.value })}
                style={inp}
              >
                <option value="">— departamento —</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ marginTop: 12, maxWidth: 360 }}>
            <MultiPicker
              testid="grupo-modelos"
              label="Avaliações do grupo:"
              opcoes={modelos.map((m) => ({
                id: m.id,
                rotulo: `[${siglaEscopo(m.escopo)}] ${m.nome}`,
              }))}
              selecionados={form.modeloIds ?? []}
              onChange={(ids) => setForm({ ...form, modeloIds: ids })}
            />
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" data-testid="grupo-salvar" style={btn("#1F2940")}>
              {editId ? "Salvar" : "Criar grupo"}
            </button>
            {editId && (
              <button type="button" onClick={reset} style={btn("#a9abbd")}>
                cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="tabela-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1F2940", color: "#fff", textAlign: "left" }}>
              {["Grupo", "Escopo", "Avaliações", "Ações"].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => {
              const podeEditar = podeGerenciar(papel, g.escopo);
              const esc = ESCOPOS.find((e) => e.value === g.escopo)!;
              return (
                <tr key={g.id} style={{ borderBottom: "1px solid #eaecf3" }}>
                  <td style={td}>
                    <strong>{g.nome}</strong>
                    {g.descricao ? (
                      <div style={{ fontSize: 11, color: "#7987A1" }}>{g.descricao}</div>
                    ) : null}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        background: esc.cor,
                        color: g.escopo === "departamento" ? "#1F2940" : "#fff",
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontSize: 11,
                      }}
                    >
                      {esc.label}
                    </span>
                  </td>
                  <td style={td}>{g.itens?.map((i) => i.modelo.nome).join(", ") || "—"}</td>
                  <td style={td}>
                    {podeEditar ? (
                      <>
                        <button onClick={() => editar(g)} style={mini("#4EC2F0")}>
                          editar
                        </button>{" "}
                        <button onClick={() => excluir(g)} style={mini("#F34343")}>
                          x
                        </button>
                      </>
                    ) : (
                      <span style={{ color: "#a9abbd", fontSize: 12 }}>leitura</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {grupos.length === 0 && (
              <tr>
                <td style={td} colSpan={4}>
                  <span style={{ color: "#a9abbd" }}>Nenhum grupo.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid #d6d6e6",
  fontSize: 13,
};
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 13 };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 13, verticalAlign: "top" };
function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
  };
}
function mini(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: bg === "#4EC2F0" ? "#1F2940" : "#fff",
    border: "none",
    borderRadius: 6,
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: 12,
  };
}
function chip(on: boolean): React.CSSProperties {
  return {
    background: on ? "#1F2940" : "#fff",
    color: on ? "#fff" : "#1F2940",
    border: "1px solid #1F2940",
    borderRadius: 20,
    padding: "5px 14px",
    cursor: "pointer",
    fontSize: 13,
  };
}

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export interface Ref { id: string; nome: string }
export interface Compartilhamento {
  id: string;
  nivel: "input" | "edit";
  aceito: boolean;
  convidadoEmail: string | null;
  user?: { id: string; nome: string; email: string } | null;
}
export interface ObjetoEstudo { id: string; nome: string; subcategoriaId: string }
export interface Produto { id: string; nome: string; marca?: string | null }
export interface Atividade { id: string; nome: string }
export interface Timing { id: string; nome: string; ordem: number }
export interface TratamentoProduto {
  id: string;
  seq: number;
  produtoId: string;
  modoAplicacao: string | null;
  dose: number | null;
  unidadeDose: string | null;
  volumeCaldaLha: number | null;
  referencia: string | null;
  timingId: string | null;
  atividadeId: string | null;
  produto?: Produto;
  timing?: Timing | null;
  atividade?: Atividade | null;
}
export interface Tratamento {
  id: string;
  numeroRef: number;
  tag: string | null;
  nome: string | null;
  descricao?: string | null;
  produtos?: TratamentoProduto[];
}
export interface Parcela {
  id: string;
  tratamentoId: string;
  bloco: number;
  numero: number;
  posLinha: number;
  posColuna: number;
  isInicio: boolean;
}
export interface Avaliacao {
  id: string;
  nome: string;
  metodologia: string | null;
  unidadeColeta: string | null;
  unidadeSaida: string | null;
  formula: string | null;
  tipo: string;
  ordem: number;
  timingId: string | null;
  dataPrevista: string | null;
  timing?: Timing | null;
  _count?: { dados: number };
}
export type EscopoModelo = "sistema" | "instituicao" | "departamento";
export interface ModeloAvaliacao {
  id: string;
  nome: string;
  descricaoColeta: string | null;
  numeroPontos: number;
  metodologiaRelatorio: string | null;
  unidadeColeta: string | null;
  unidadeSaida: string | null;
  calculoRelatorio: string | null;
  escopo: EscopoModelo;
  instituicaoId: string | null;
  departamentoId: string | null;
  baseadoEmId: string | null;
  ativo: boolean;
  prerequisitos?: { prerequisitoId: string; prerequisito: { id: string; nome: string } }[];
  _count?: { avaliacoes: number };
}
export interface ModeloAvaliacaoInput {
  nome: string;
  descricaoColeta?: string;
  numeroPontos?: number;
  metodologiaRelatorio?: string;
  unidadeColeta?: string;
  unidadeSaida?: string;
  calculoRelatorio?: string;
  escopo: EscopoModelo;
  departamentoId?: string;
  baseadoEmId?: string;
  prerequisitoIds?: string[];
}

export interface AvaliacaoDado {
  id: string;
  parcelaId: string;
  numAmostra: number;
  valorColetado: number | null;
  numLinhasColhidas: number | null;
  comprimentoColhidoM: number | null;
  areaUtilM2: number | null;
  obs: string | null;
  parcela?: Parcela & { tratamento?: Tratamento };
}
export interface RelatorioAvaliacao {
  avaliacao: { nome: string; unidadeColeta: string | null; unidadeSaida: string | null; formula: string | null };
  linhas: Array<{ parcela: number; bloco: number; tratamento: string; tratamentoNome: string; valorColetado: number | null; areaUtilM2: number | null; valorSaida: number | null }>;
  medias: Array<{ tratamento: string; nome: string; media: number }>;
}
export interface AprovacaoInterna { id: string; aprovadorUserId: string; decisao: string; motivo: string | null; at: string }
export interface AprovacaoCliente { id: string; clienteEmail: string; token: string; decisao: string; motivo: string | null }
export interface OrdemServico {
  id: string;
  status: string;
  aprovacoesInternas: AprovacaoInterna[];
  aprovacaoCliente: AprovacaoCliente | null;
}
export interface Instituicao { id: string; nome: string; politicaAprovacao: string; nAprovadores: number }
export interface Aprovador { id: string; userId: string; ativo: boolean; user: { id: string; nome: string; email: string } }
export interface AnaliseResultado {
  avaliacao: { nome: string; unidadeSaida: string | null };
  delineamento: string;
  n: number;
  resultado: {
    tabela: { fonte: string; gl: number; sq: number; qm: number; f?: number; p?: number }[];
    mediaGeral: number;
    cv: number;
    fTratamento: number;
    pTratamento: number;
    significativo: boolean;
    medias: { tratamento: string; media: number; n: number; letra?: string }[];
    pressupostos: { bartlettEstatistica: number; bartlettP: number; homogeneo: boolean };
    comparacao: { metodo: string; alpha: number };
  };
}
export interface Experimento {
  id: string;
  codigo: string | null;
  titulo: string;
  objetivo?: string | null;
  ensaio: string;
  status: string;
  instituicao?: { nome: string } | null;
  cultivar?: string | null;
  tipoExecucao?: string | null;
  metodologia?: string | null;
  justificativa?: string | null;
  observacoes?: string | null;
  objetoEstudoId?: string | null;
  localId?: string | null;
  safraId?: string | null;
  areaPesquisaId?: string | null;
  delineamentoId?: string | null;
  parcelaLarguraM?: number | null;
  parcelaComprimentoM?: number | null;
  parcelaNumLinhas?: number | null;
  numTratamentos: number | null;
  numRepeticoes: number | null;
  totalParcelas: number | null;
  espacamentoLinhasM: number | null;
  objetoEstudo?: Ref | null;
  local?: Ref | null;
  safra?: Ref | null;
  areaPesquisa?: Ref | null;
  delineamento?: { id?: string; nome: string } | null;
  tratamentos?: Tratamento[];
  parcelas?: Parcela[];
  fatores?: Array<{ id: string; nome: string; ordem: number; niveis: { id: string; valor: string }[] }>;
  avaliacoes?: Avaliacao[];
  timings?: Timing[];
  owner?: { id: string; nome: string } | null;
  compartilhadoComigo?: boolean;
  compartilhamentos?: Compartilhamento[];
  _count?: { tratamentos: number; parcelas: number };
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("exp_token") : null;
  const r = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
    ...init,
  });
  if (r.status === 401 && typeof window !== "undefined") {
    window.localStorage.removeItem("exp_token");
    if (window.location.pathname !== "/login") window.location.href = "/login";
    throw new Error("Sessão expirada.");
  }
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

export interface Usuario { id: string; nome: string; email: string; papel?: Papel; departamentoId?: string | null; unidadeId?: string | null; isAdminInstituicao: boolean; ativo: boolean }
export interface Departamento { id: string; nome: string; ativo: boolean; _count?: { unidades: number; usuarios: number } }
export interface Responsavel { id: string; user: { id: string; nome: string; email: string; papel?: Papel } }
export interface Unidade { id: string; nome: string; tipo: string; departamentoId: string | null }

export type Papel =
  | "admin_sistema"
  | "gestao_instituicao"
  | "gestao_departamento"
  | "coordenador_area"
  | "pesquisador"
  | "analista"
  | "assistente";

/** Papéis selecionáveis na gestão da instituição (admin_sistema é global, fora daqui). */
export const PAPEIS: { value: Papel; label: string }[] = [
  { value: "gestao_instituicao", label: "Gestão da instituição" },
  { value: "gestao_departamento", label: "Gestão de departamento" },
  { value: "coordenador_area", label: "Coordenador de área/laboratório" },
  { value: "pesquisador", label: "Pesquisador" },
  { value: "analista", label: "Analista" },
  { value: "assistente", label: "Assistente" },
];

export interface Contagem { rotulo: string; n: number }
export interface ChecklistItem {
  avaliacao: string;
  experimento: string;
  experimentoId: string;
  dataPrevista: string | null;
  estado: "realizada" | "pendente" | "atrasada";
}
export interface Dashboard {
  escopo: Papel;
  totais: { experimentos: number; emConducao: number };
  porStatus: Contagem[];
  porEnsaio: Contagem[];
  porLocal: Contagem[];
  porArea: Contagem[];
  porSafra: Contagem[];
  checklist: { previstas: number; realizadas: number; pendentes: number; atrasadas: number; itens: ChecklistItem[] };
}

export const api = {
  dashboard: () => req<Dashboard>("/dashboard"),
  listar: () => req<Experimento[]>("/experimentos"),
  obter: (id: string) => req<Experimento>(`/experimentos/${id}`),
  criar: (body: Record<string, unknown>) =>
    req<Experimento>("/experimentos", { method: "POST", body: JSON.stringify(body) }),
  atualizar: (id: string, body: Record<string, unknown>) =>
    req<Experimento>(`/experimentos/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  definirFatores: (id: string, fatores: Array<{ ordem: number; nome: string; niveis: string[] }>) =>
    req<Experimento>(`/experimentos/${id}/fatores`, { method: "POST", body: JSON.stringify({ fatores }) }),
  gerarCroqui: (id: string, body: { delineamento?: string; blocos?: number; seed?: number; numeroInicial?: number }) =>
    req<Experimento>(`/experimentos/${id}/croqui/gerar`, { method: "POST", body: JSON.stringify(body) }),
  salvarCroqui: (id: string, parcelas: Parcela[]) =>
    req<Experimento>(`/experimentos/${id}/croqui`, { method: "PUT", body: JSON.stringify({ parcelas }) }),

  // cadastros e tratamentos
  listarProdutos: () => req<Produto[]>("/cadastros/produtos"),
  criarProduto: (nome: string) => req<Produto>("/cadastros/produtos", { method: "POST", body: JSON.stringify({ nome }) }),
  listarAtividades: () => req<Atividade[]>("/cadastros/atividades"),
  listarTimings: (id: string) => req<Timing[]>(`/experimentos/${id}/timings`),
  criarTiming: (id: string, nome: string) => req<Timing>(`/experimentos/${id}/timings`, { method: "POST", body: JSON.stringify({ nome }) }),
  atualizarTratamento: (id: string, body: { nome?: string; descricao?: string }) =>
    req<Tratamento>(`/tratamentos/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  adicionarProduto: (tratamentoId: string, body: Partial<TratamentoProduto>) =>
    req<TratamentoProduto>(`/tratamentos/${tratamentoId}/produtos`, { method: "POST", body: JSON.stringify(body) }),
  removerProduto: (id: string) => req<{ ok: boolean }>(`/tratamento-produtos/${id}`, { method: "DELETE" }),

  // avaliações
  criarAvaliacao: (id: string, body: Partial<Avaliacao>) =>
    req<Avaliacao>(`/experimentos/${id}/avaliacoes`, { method: "POST", body: JSON.stringify(body) }),
  removerAvaliacao: (id: string) => req<{ ok: boolean }>(`/avaliacoes/${id}`, { method: "DELETE" }),
  listarDados: (avaliacaoId: string) => req<AvaliacaoDado[]>(`/avaliacoes/${avaliacaoId}/dados`),
  lancarDados: (avaliacaoId: string, dados: Array<Partial<AvaliacaoDado>>) =>
    req<AvaliacaoDado[]>(`/avaliacoes/${avaliacaoId}/dados`, { method: "POST", body: JSON.stringify({ dados }) }),
  relatorioAvaliacao: (avaliacaoId: string) => req<RelatorioAvaliacao>(`/avaliacoes/${avaliacaoId}/relatorio`),
  adicionarAvaliacoesDoModelo: (expId: string, modeloIds: string[]) =>
    req<{ criadas: Avaliacao[]; prerequisitosAdicionados: string[] }>(
      `/experimentos/${expId}/avaliacoes/do-modelo`,
      { method: "POST", body: JSON.stringify({ modeloIds }) },
    ),

  // catálogo de modelos de avaliação (multi-escopo)
  listarModelos: () => req<ModeloAvaliacao[]>("/modelos-avaliacao"),
  criarModelo: (body: ModeloAvaliacaoInput) =>
    req<ModeloAvaliacao>("/modelos-avaliacao", { method: "POST", body: JSON.stringify(body) }),
  atualizarModelo: (id: string, body: Partial<ModeloAvaliacaoInput>) =>
    req<ModeloAvaliacao>(`/modelos-avaliacao/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  removerModelo: (id: string) => req<{ ok: boolean }>(`/modelos-avaliacao/${id}`, { method: "DELETE" }),
  analiseAvaliacao: (avaliacaoId: string, metodo?: "LSD" | "Tukey" | "ScottKnott") =>
    req<AnaliseResultado>(`/avaliacoes/${avaliacaoId}/analise${metodo ? `?metodo=${metodo}` : ""}`),

  // cadastros gerais
  locais: () => req<Ref[]>("/cadastros/locais"),
  safras: () => req<Ref[]>("/cadastros/safras"),
  areas: () => req<Ref[]>("/cadastros/areas"),
  delineamentos: () => req<Ref[]>("/cadastros/delineamentos"),
  categorias: () => req<Ref[]>("/cadastros/categorias"),
  subcategorias: (categoriaId: string) => req<Ref[]>(`/cadastros/subcategorias?categoriaId=${categoriaId}`),
  objetos: (subcategoriaId: string) => req<ObjetoEstudo[]>(`/cadastros/objetos?subcategoriaId=${subcategoriaId}`),
  criarCadastro: (tipo: "locais" | "safras" | "areas" | "delineamentos" | "categorias", nome: string) =>
    req<Ref>(`/cadastros/${tipo}`, { method: "POST", body: JSON.stringify({ nome }) }),
  criarSubcategoria: (categoriaId: string, nome: string) =>
    req<Ref>("/cadastros/subcategorias", { method: "POST", body: JSON.stringify({ categoriaId, nome }) }),
  criarObjeto: (subcategoriaId: string, nome: string) =>
    req<ObjetoEstudo>("/cadastros/objetos", { method: "POST", body: JSON.stringify({ subcategoriaId, nome }) }),

  // usuários (admin da instituição)
  listarUsuarios: () => req<Usuario[]>("/usuarios"),
  criarUsuario: (body: { nome: string; email: string; senha: string; papel?: Papel; isAdminInstituicao?: boolean }) =>
    req<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(body) }),
  atualizarUsuario: (id: string, body: { papel?: Papel; departamentoId?: string | null; unidadeId?: string | null; ativo?: boolean }) =>
    req<Usuario>(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // departamentos + unidades (hierarquia organizacional)
  departamentos: () => req<Departamento[]>("/departamentos"),
  unidades: () => req<Unidade[]>("/departamentos/unidades"),
  criarDepartamento: (nome: string) => req<Departamento>("/departamentos", { method: "POST", body: JSON.stringify({ nome }) }),
  atualizarDepartamento: (id: string, body: { nome?: string; ativo?: boolean }) =>
    req<Departamento>(`/departamentos/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  desativarDepartamento: (id: string) => req<{ ok: boolean }>(`/departamentos/${id}`, { method: "DELETE" }),

  // responsáveis pela coleta
  listarResponsaveis: (expId: string) => req<Responsavel[]>(`/experimentos/${expId}/responsaveis`),
  adicionarResponsavel: (expId: string, userId: string) =>
    req<Responsavel>(`/experimentos/${expId}/responsaveis`, { method: "POST", body: JSON.stringify({ userId }) }),
  removerResponsavel: (expId: string, userId: string) =>
    req<{ ok: boolean }>(`/experimentos/${expId}/responsaveis/${userId}`, { method: "DELETE" }),

  // compartilhamento
  listarCompartilhamentos: (expId: string) => req<Compartilhamento[]>(`/experimentos/${expId}/compartilhamentos`),
  compartilhar: (expId: string, body: { email: string; nivel: "input" | "edit" }) =>
    req<Compartilhamento>(`/experimentos/${expId}/compartilhar`, { method: "POST", body: JSON.stringify(body) }),
  revogarCompartilhamento: (shareId: string) =>
    req<{ ok: boolean }>(`/compartilhamentos/${shareId}`, { method: "DELETE" }),

  // instituição + aprovadores
  obterInstituicao: () => req<Instituicao>("/instituicao"),
  atualizarInstituicao: (body: { politicaAprovacao?: string; nAprovadores?: number }) =>
    req<Instituicao>("/instituicao", { method: "PUT", body: JSON.stringify(body) }),
  listarAprovadores: () => req<Aprovador[]>("/instituicao/aprovadores"),
  adicionarAprovador: (userId: string) =>
    req<Aprovador>("/instituicao/aprovadores", { method: "POST", body: JSON.stringify({ userId }) }),
  removerAprovador: (id: string) => req<{ ok: boolean }>(`/instituicao/aprovadores/${id}`, { method: "DELETE" }),

  // ordem de serviço
  listarOS: (expId: string) => req<OrdemServico[]>(`/experimentos/${expId}/ordens-servico`),
  criarOS: (expId: string) => req<OrdemServico>(`/experimentos/${expId}/ordens-servico`, { method: "POST" }),
  submeterOS: (osId: string, clienteEmail: string) =>
    req<OrdemServico>(`/ordens-servico/${osId}/submeter`, { method: "POST", body: JSON.stringify({ clienteEmail }) }),
  aprovarInternoOS: (osId: string, decisao: "aprovado" | "recusado", motivo?: string) =>
    req<OrdemServico>(`/ordens-servico/${osId}/aprovar-interno`, { method: "POST", body: JSON.stringify({ decisao, motivo }) }),
};

/** Baixa o experimento em Excel (com token), via blob. */
export async function baixarExperimentoXlsx(expId: string, nomeArquivo: string) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("exp_token") : null;
  const r = await fetch(`${API_BASE}/experimentos/${expId}/export.xlsx`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error("Falha ao exportar.");
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nomeArquivo}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Baixa o relatório PPTX (com token), via blob. */
export async function baixarRelatorioPptx(expId: string, nomeArquivo: string) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("exp_token") : null;
  const r = await fetch(`${API_BASE}/experimentos/${expId}/relatorio.pptx`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error("Falha ao gerar relatório.");
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nomeArquivo}.pptx`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Decisão pública do cliente (sem auth) — usada na página /aprovacao/[token]. */
export async function decisaoCliente(token: string, decisao: "aprovado" | "recusado", motivo?: string) {
  const r = await fetch(`${API_BASE}/aprovacao-cliente/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decisao, motivo }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ ok: boolean; experimento: string; decisao: string }>;
}

/** Cores suaves por índice de tratamento (espelha o sistema-base). */
export function corTratamento(numeroRef: number): string {
  const cores = ["#F6A6A6", "#F8C99B", "#F5E69B", "#CBD2DE", "#9BD2F5", "#C9B3F0", "#F0B3D6", "#E2D7A6"];
  return cores[(numeroRef - 1) % cores.length];
}

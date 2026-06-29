export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export interface Ref {
  id: string;
  nome: string;
}
export interface Categoria extends Ref {
  isCultura?: boolean;
  isAtivo?: boolean;
}
export interface Compartilhamento {
  id: string;
  nivel: "INPUT" | "EDIT";
  isAceito: boolean;
  convidadoEmail: string | null;
  user?: { id: string; nome: string; email: string } | null;
}
export interface ObjetoEstudo {
  id: string;
  nome: string;
  subcategoriaId: string;
}
export interface Produto {
  id: string;
  nome: string;
  marca?: string | null;
}
export interface Atividade {
  id: string;
  nome: string;
}
export interface Timing {
  id: string;
  nome: string;
  ordem: number;
}
export interface TratamentoProduto {
  id: string;
  sequencia: number;
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
  posicaoLinha: number;
  posicaoColuna: number;
  isInicio: boolean;
  // Split-plot (PARCELA_SUBDIVIDIDA): grupo da parcela principal + níveis. Nulos no fatorial.
  grupoPrincipal?: number | null;
  nivelPrincipal?: number | null;
  nivelSub?: number | null;
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
  grupoColetaId?: string | null;
  dataPrevista: string | null;
  timing?: Timing | null;
  _count?: { dados: number };
}
export type EscopoModelo = "SISTEMA" | "INSTITUICAO" | "DEPARTAMENTO";
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
  isAtivo: boolean;
  prerequisitos?: { prerequisitoId: string; prerequisito: { id: string; nome: string } }[];
  prerequisitosAtividade?: {
    modeloAtividadeId: string;
    modeloAtividade: { id: string; nome: string; tipo: string };
  }[];
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
  prerequisitoAtividadeIds?: string[];
}

// ---- Atividades (Macro C) ----
export type TipoAtividade = "ACAO" | "APONTAMENTO";
export type TipoCampo = "NUMERO" | "TEXTO" | "DATA" | "BOOLEANO";
export interface ModeloAtividadeCampo {
  id?: string;
  rotulo: string;
  tipo: TipoCampo;
  unidade?: string | null;
  isObrigatorio: boolean;
  ordem: number;
}
export interface ModeloAtividade {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: TipoAtividade;
  metodologiaRelatorio: string | null;
  escopo: EscopoModelo;
  instituicaoId: string | null;
  departamentoId: string | null;
  isAtivo: boolean;
  campos?: ModeloAtividadeCampo[];
  _count?: { atividades: number };
}
export interface ModeloAtividadeInput {
  nome: string;
  descricao?: string;
  tipo: TipoAtividade;
  metodologiaRelatorio?: string;
  escopo: EscopoModelo;
  departamentoId?: string;
  campos?: {
    rotulo: string;
    tipo?: TipoCampo;
    unidade?: string;
    isObrigatorio?: boolean;
    ordem?: number;
  }[];
}
export interface AtividadeApontamentoValor {
  id: string;
  rotulo: string;
  valorNum: number | null;
  valorTexto: string | null;
  valorData: string | null;
  valorBool: boolean | null;
}
export interface ValorApontamentoInput {
  rotulo: string;
  valorNum?: number | null;
  valorTexto?: string | null;
  valorData?: string | null;
  valorBool?: boolean | null;
}
export interface AtividadeExperimento {
  id: string;
  nome: string;
  tipo: TipoAtividade;
  marco?: string | null;
  dataPrevista?: string | null;
  isConfirmada?: boolean;
  data: string | null;
  responsavel: string | null;
  observacoes: string | null;
  ordem: number;
  modeloId: string | null;
  valores: AtividadeApontamentoValor[];
  modelo?: ModeloAtividade | null;
}

// ---- Grupos de coleta (Macro B) ----
export interface GrupoColeta {
  id: string;
  nome: string;
  descricao: string | null;
  escopo: EscopoModelo;
  instituicaoId: string | null;
  departamentoId: string | null;
  isAtivo: boolean;
  itens?: { modeloId: string; modelo: { id: string; nome: string } }[];
}
export interface GrupoColetaInput {
  nome: string;
  descricao?: string;
  escopo: EscopoModelo;
  departamentoId?: string;
  modeloIds?: string[];
}
export interface LancamentoLote {
  avaliacaoId: string;
  parcelaId: string;
  numeroAmostra?: number;
  valorColetado?: number | null;
}

export interface AvaliacaoDado {
  id: string;
  parcelaId: string;
  numeroAmostra: number;
  valorColetado: number | null;
  numLinhasColhidas: number | null;
  comprimentoColhidoM: number | null;
  areaUtilM2: number | null;
  observacoes: string | null;
  parcela?: Parcela & { tratamento?: Tratamento };
}
export interface RelatorioAvaliacao {
  avaliacao: {
    nome: string;
    unidadeColeta: string | null;
    unidadeSaida: string | null;
    formula: string | null;
  };
  linhas: Array<{
    parcela: number;
    bloco: number;
    tratamento: string;
    tratamentoNome: string;
    valorColetado: number | null;
    areaUtilM2: number | null;
    valorSaida: number | null;
  }>;
  medias: Array<{ tratamento: string; nome: string; media: number }>;
}
export interface AprovacaoInterna {
  id: string;
  aprovadorUserId: string;
  decisao: string;
  motivo: string | null;
  decididoAt: string;
}
export interface AprovacaoCliente {
  id: string;
  clienteEmail: string;
  token: string;
  decisao: string;
  motivo: string | null;
}
export interface OrdemServico {
  id: string;
  status: string;
  aprovacoesInternas: AprovacaoInterna[];
  aprovacaoCliente: AprovacaoCliente | null;
}
export interface Instituicao {
  id: string;
  nome: string;
  politicaAprovacao: string;
  numeroAprovadores: number;
}
export interface Aprovador {
  id: string;
  userId: string;
  isAtivo: boolean;
  user: { id: string; nome: string; email: string };
}
interface LinhaAnova {
  fonte: string;
  gl: number;
  sq: number;
  qm?: number;
  f?: number;
  p?: number;
}
export interface AnaliseUmFator {
  tabela: LinhaAnova[];
  mediaGeral: number;
  cv: number;
  fTratamento: number;
  pTratamento: number;
  significativo: boolean;
  medias: { tratamento: string; media: number; n: number; letra?: string }[];
  pressupostos: { bartlettEstatistica: number; bartlettP: number; homogeneo: boolean };
  comparacao: { metodo: string; alpha: number };
}
export interface AnaliseSplit {
  esquema: "PARCELA_SUBDIVIDIDA";
  tabela: LinhaAnova[];
  mediaGeral: number;
  cvParcela: number;
  cvSubparcela: number;
  fatorA: { f: number; p: number; significativo: boolean };
  fatorB: { f: number; p: number; significativo: boolean };
  interacao: { f: number; p: number; significativo: boolean };
  mediasA: { nivel: string; media: number; n: number }[];
  mediasB: { nivel: string; media: number; n: number }[];
}
type AvaliacaoRef = { nome: string; unidadeSaida: string | null };
export type AnaliseResultado =
  | {
      avaliacao: AvaliacaoRef;
      esquema?: null;
      delineamento: string;
      n: number;
      resultado: AnaliseUmFator;
    }
  | { avaliacao: AvaliacaoRef; esquema: "PARCELA_SUBDIVIDIDA"; n: number; resultado: AnaliseSplit };
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
  tipoPeriodo?: "SAFRA" | "ANO_SEMESTRE" | null;
  anoSemestre?: string | null;
  objetoEstudoId?: string | null;
  localId?: string | null;
  safraId?: string | null;
  areaPesquisaId?: string | null;
  delineamentoId?: string | null;
  parcelaLarguraM?: number | null;
  parcelaComprimentoM?: number | null;
  parcelaNumeroLinhas?: number | null;
  numeroTratamentos: number | null;
  numeroRepeticoes: number | null;
  totalParcelas: number | null;
  espacamentoLinhasM: number | null;
  esquema?: "FATORIAL" | "PARCELA_SUBDIVIDIDA" | null;
  fatorPrincipalOrdem?: number | null;
  objetoEstudo?: Ref | null;
  local?: Ref | null;
  safra?: Ref | null;
  areaPesquisa?: Ref | null;
  delineamento?: { id?: string; nome: string } | null;
  tratamentos?: Tratamento[];
  parcelas?: Parcela[];
  fatores?: Array<{
    id: string;
    nome: string;
    ordem: number;
    niveis: { id: string; valor: string }[];
  }>;
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

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel?: Papel;
  departamentoId?: string | null;
  unidadeId?: string | null;
  isAdminInstituicao: boolean;
  isAtivo: boolean;
}
export interface Departamento {
  id: string;
  nome: string;
  isAtivo: boolean;
  _count?: { unidades: number; usuarios: number };
}
export interface Responsavel {
  id: string;
  user: { id: string; nome: string; email: string; papel?: Papel };
}
export interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  departamentoId: string | null;
}

export type Papel =
  | "ADMIN_SISTEMA"
  | "GESTAO_INSTITUICAO"
  | "GESTAO_DEPARTAMENTO"
  | "COORDENADOR_AREA"
  | "PESQUISADOR"
  | "ANALISTA"
  | "ASSISTENTE";

/** Papéis selecionáveis na gestão da instituição (admin_sistema é global, fora daqui). */
export const PAPEIS: { value: Papel; label: string }[] = [
  { value: "GESTAO_INSTITUICAO", label: "Gestão da instituição" },
  { value: "GESTAO_DEPARTAMENTO", label: "Gestão de departamento" },
  { value: "COORDENADOR_AREA", label: "Coordenador de área/laboratório" },
  { value: "PESQUISADOR", label: "Pesquisador" },
  { value: "ANALISTA", label: "Analista" },
  { value: "ASSISTENTE", label: "Assistente" },
];

export interface Contagem {
  rotulo: string;
  n: number;
}
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
  checklist: {
    previstas: number;
    realizadas: number;
    pendentes: number;
    atrasadas: number;
    itens: ChecklistItem[];
  };
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
    req<Experimento>(`/experimentos/${id}/fatores`, {
      method: "POST",
      body: JSON.stringify({ fatores }),
    }),
  gerarCroqui: (
    id: string,
    body: {
      delineamento?: string;
      blocos?: number;
      seed?: number;
      numeroInicial?: number;
      esquema?: "FATORIAL" | "PARCELA_SUBDIVIDIDA";
      fatorPrincipalOrdem?: number;
    },
  ) =>
    req<Experimento>(`/experimentos/${id}/croqui/gerar`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  salvarCroqui: (id: string, parcelas: Parcela[]) =>
    req<Experimento>(`/experimentos/${id}/croqui`, {
      method: "PUT",
      body: JSON.stringify({ parcelas }),
    }),

  // cadastros e tratamentos
  listarProdutos: () => req<Produto[]>("/cadastros/produtos"),
  criarProduto: (nome: string) =>
    req<Produto>("/cadastros/produtos", { method: "POST", body: JSON.stringify({ nome }) }),
  listarAtividades: () => req<Atividade[]>("/cadastros/atividades"),
  listarTimings: (id: string) => req<Timing[]>(`/experimentos/${id}/timings`),
  criarTiming: (id: string, nome: string) =>
    req<Timing>(`/experimentos/${id}/timings`, { method: "POST", body: JSON.stringify({ nome }) }),
  atualizarTratamento: (id: string, body: { nome?: string; descricao?: string }) =>
    req<Tratamento>(`/tratamentos/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  adicionarProduto: (tratamentoId: string, body: Partial<TratamentoProduto>) =>
    req<TratamentoProduto>(`/tratamentos/${tratamentoId}/produtos`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  removerProduto: (id: string) =>
    req<{ ok: boolean }>(`/tratamento-produtos/${id}`, { method: "DELETE" }),

  // avaliações
  criarAvaliacao: (id: string, body: Partial<Avaliacao>) =>
    req<Avaliacao>(`/experimentos/${id}/avaliacoes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  removerAvaliacao: (id: string) => req<{ ok: boolean }>(`/avaliacoes/${id}`, { method: "DELETE" }),
  listarDados: (avaliacaoId: string) => req<AvaliacaoDado[]>(`/avaliacoes/${avaliacaoId}/dados`),
  lancarDados: (avaliacaoId: string, dados: Array<Partial<AvaliacaoDado>>) =>
    req<AvaliacaoDado[]>(`/avaliacoes/${avaliacaoId}/dados`, {
      method: "POST",
      body: JSON.stringify({ dados }),
    }),
  relatorioAvaliacao: (avaliacaoId: string) =>
    req<RelatorioAvaliacao>(`/avaliacoes/${avaliacaoId}/relatorio`),
  adicionarAvaliacoesDoModelo: (expId: string, modeloIds: string[]) =>
    req<{
      criadas: Avaliacao[];
      prerequisitosAdicionados: string[];
      atividadesAdicionadas: string[];
    }>(`/experimentos/${expId}/avaliacoes/do-modelo`, {
      method: "POST",
      body: JSON.stringify({ modeloIds }),
    }),

  // catálogo de modelos de avaliação (multi-escopo)
  listarModelos: () => req<ModeloAvaliacao[]>("/modelos-avaliacao"),
  criarModelo: (body: ModeloAvaliacaoInput) =>
    req<ModeloAvaliacao>("/modelos-avaliacao", { method: "POST", body: JSON.stringify(body) }),
  atualizarModelo: (id: string, body: Partial<ModeloAvaliacaoInput>) =>
    req<ModeloAvaliacao>(`/modelos-avaliacao/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  removerModelo: (id: string) =>
    req<{ ok: boolean }>(`/modelos-avaliacao/${id}`, { method: "DELETE" }),

  // catálogo de modelos de atividade (multi-escopo)
  listarModelosAtividade: () => req<ModeloAtividade[]>("/modelos-atividade"),
  criarModeloAtividade: (body: ModeloAtividadeInput) =>
    req<ModeloAtividade>("/modelos-atividade", { method: "POST", body: JSON.stringify(body) }),
  atualizarModeloAtividade: (id: string, body: Partial<ModeloAtividadeInput>) =>
    req<ModeloAtividade>(`/modelos-atividade/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  removerModeloAtividade: (id: string) =>
    req<{ ok: boolean }>(`/modelos-atividade/${id}`, { method: "DELETE" }),

  // atividades do experimento
  listarAtividadesExp: (expId: string) =>
    req<AtividadeExperimento[]>(`/experimentos/${expId}/atividades`),
  criarAtividadeExp: (
    expId: string,
    body: {
      modeloId?: string;
      nome?: string;
      tipo?: TipoAtividade;
      data?: string;
      responsavel?: string;
      observacoes?: string;
    },
  ) =>
    req<AtividadeExperimento>(`/experimentos/${expId}/atividades`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  registrarApontamento: (atividadeId: string, valores: ValorApontamentoInput[]) =>
    req<AtividadeExperimento>(`/atividades/${atividadeId}/apontamento`, {
      method: "POST",
      body: JSON.stringify({ valores }),
    }),
  atualizarAtividadeExp: (
    atividadeId: string,
    body: {
      dataPrevista?: string | null;
      isConfirmada?: boolean;
      data?: string | null;
      responsavel?: string;
      observacoes?: string;
    },
  ) =>
    req<AtividadeExperimento>(`/atividades/${atividadeId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  removerAtividadeExp: (atividadeId: string) =>
    req<{ ok: boolean }>(`/atividades/${atividadeId}`, { method: "DELETE" }),
  gerarMarcos: (expId: string) =>
    req<{ criados: string[]; isCultura: boolean }>(`/experimentos/${expId}/marcos/gerar`, {
      method: "POST",
    }),

  // grupos de coleta + coleta em lote
  listarGrupos: () => req<GrupoColeta[]>("/grupos-coleta"),
  criarGrupo: (body: GrupoColetaInput) =>
    req<GrupoColeta>("/grupos-coleta", { method: "POST", body: JSON.stringify(body) }),
  atualizarGrupo: (id: string, body: Partial<GrupoColetaInput>) =>
    req<GrupoColeta>(`/grupos-coleta/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  removerGrupo: (id: string) => req<{ ok: boolean }>(`/grupos-coleta/${id}`, { method: "DELETE" }),
  aplicarGrupo: (expId: string, grupoId: string) =>
    req<{
      criadas: Avaliacao[];
      prerequisitosAdicionados: string[];
      atividadesAdicionadas: string[];
    }>(`/experimentos/${expId}/grupos/${grupoId}/aplicar`, { method: "POST" }),
  lancarLote: (expId: string, lancamentos: LancamentoLote[]) =>
    req<{ salvos: number }>(`/experimentos/${expId}/coleta-lote`, {
      method: "POST",
      body: JSON.stringify({ lancamentos }),
    }),
  analiseAvaliacao: (avaliacaoId: string, metodo?: "LSD" | "Tukey" | "ScottKnott") =>
    req<AnaliseResultado>(`/avaliacoes/${avaliacaoId}/analise${metodo ? `?metodo=${metodo}` : ""}`),

  // cadastros gerais
  locais: () => req<Ref[]>("/cadastros/locais"),
  safras: () => req<Ref[]>("/cadastros/safras"),
  areas: () => req<Ref[]>("/cadastros/areas"),
  delineamentos: () => req<Ref[]>("/cadastros/delineamentos"),
  categorias: () => req<Categoria[]>("/cadastros/categorias"),
  atualizarCategoria: (id: string, body: { nome?: string; isCultura?: boolean }) =>
    req<Categoria>(`/cadastros/categorias/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  subcategorias: (categoriaId: string) =>
    req<Ref[]>(`/cadastros/subcategorias?categoriaId=${categoriaId}`),
  objetos: (subcategoriaId: string) =>
    req<ObjetoEstudo[]>(`/cadastros/objetos?subcategoriaId=${subcategoriaId}`),
  criarCadastro: (
    tipo: "locais" | "safras" | "areas" | "delineamentos" | "categorias",
    nome: string,
  ) => req<Ref>(`/cadastros/${tipo}`, { method: "POST", body: JSON.stringify({ nome }) }),
  criarSubcategoria: (categoriaId: string, nome: string) =>
    req<Ref>("/cadastros/subcategorias", {
      method: "POST",
      body: JSON.stringify({ categoriaId, nome }),
    }),
  criarObjeto: (subcategoriaId: string, nome: string) =>
    req<ObjetoEstudo>("/cadastros/objetos", {
      method: "POST",
      body: JSON.stringify({ subcategoriaId, nome }),
    }),

  // usuários (admin da instituição)
  listarUsuarios: () => req<Usuario[]>("/usuarios"),
  criarUsuario: (body: {
    nome: string;
    email: string;
    senha: string;
    papel?: Papel;
    isAdminInstituicao?: boolean;
  }) => req<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(body) }),
  atualizarUsuario: (
    id: string,
    body: {
      papel?: Papel;
      departamentoId?: string | null;
      unidadeId?: string | null;
      isAtivo?: boolean;
    },
  ) => req<Usuario>(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // departamentos + unidades (hierarquia organizacional)
  departamentos: () => req<Departamento[]>("/departamentos"),
  unidades: () => req<Unidade[]>("/departamentos/unidades"),
  criarDepartamento: (nome: string) =>
    req<Departamento>("/departamentos", { method: "POST", body: JSON.stringify({ nome }) }),
  atualizarDepartamento: (id: string, body: { nome?: string; isAtivo?: boolean }) =>
    req<Departamento>(`/departamentos/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  desativarDepartamento: (id: string) =>
    req<{ ok: boolean }>(`/departamentos/${id}`, { method: "DELETE" }),

  // responsáveis pela coleta
  listarResponsaveis: (expId: string) => req<Responsavel[]>(`/experimentos/${expId}/responsaveis`),
  adicionarResponsavel: (expId: string, userId: string) =>
    req<Responsavel>(`/experimentos/${expId}/responsaveis`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  removerResponsavel: (expId: string, userId: string) =>
    req<{ ok: boolean }>(`/experimentos/${expId}/responsaveis/${userId}`, { method: "DELETE" }),

  // compartilhamento
  listarCompartilhamentos: (expId: string) =>
    req<Compartilhamento[]>(`/experimentos/${expId}/compartilhamentos`),
  compartilhar: (expId: string, body: { email: string; nivel: "INPUT" | "EDIT" }) =>
    req<Compartilhamento>(`/experimentos/${expId}/compartilhar`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  revogarCompartilhamento: (shareId: string) =>
    req<{ ok: boolean }>(`/compartilhamentos/${shareId}`, { method: "DELETE" }),

  // instituição + aprovadores
  obterInstituicao: () => req<Instituicao>("/instituicao"),
  atualizarInstituicao: (body: { politicaAprovacao?: string; numeroAprovadores?: number }) =>
    req<Instituicao>("/instituicao", { method: "PUT", body: JSON.stringify(body) }),
  listarAprovadores: () => req<Aprovador[]>("/instituicao/aprovadores"),
  adicionarAprovador: (userId: string) =>
    req<Aprovador>("/instituicao/aprovadores", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  removerAprovador: (id: string) =>
    req<{ ok: boolean }>(`/instituicao/aprovadores/${id}`, { method: "DELETE" }),

  // ordem de serviço
  listarOS: (expId: string) => req<OrdemServico[]>(`/experimentos/${expId}/ordens-servico`),
  criarOS: (expId: string) =>
    req<OrdemServico>(`/experimentos/${expId}/ordens-servico`, { method: "POST" }),
  submeterOS: (osId: string, clienteEmail: string) =>
    req<OrdemServico>(`/ordens-servico/${osId}/submeter`, {
      method: "POST",
      body: JSON.stringify({ clienteEmail }),
    }),
  aprovarInternoOS: (osId: string, decisao: "APROVADO" | "RECUSADO", motivo?: string) =>
    req<OrdemServico>(`/ordens-servico/${osId}/aprovar-interno`, {
      method: "POST",
      body: JSON.stringify({ decisao, motivo }),
    }),
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
export async function decisaoCliente(
  token: string,
  decisao: "APROVADO" | "RECUSADO",
  motivo?: string,
) {
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
  const cores = [
    "#F6A6A6",
    "#F8C99B",
    "#F5E69B",
    "#CBD2DE",
    "#9BD2F5",
    "#C9B3F0",
    "#F0B3D6",
    "#E2D7A6",
  ];
  return cores[(numeroRef - 1) % cores.length];
}

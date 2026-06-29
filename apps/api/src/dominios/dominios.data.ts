/**
 * Dicionário de valores enumerados (D6 / §4.9 do padrão de desenvolvimento).
 * Fonte única dos rótulos PT de cada enum. Seedado em `DominioValor` para que o
 * significado de cada código viva no banco (consultável pelo usuário/admin),
 * não apenas no código. `validarCobertura` garante que todo valor de enum do
 * Prisma tem rótulo aqui (sem órfãos) — chamado no seed.
 */
import * as Prisma from "@prisma/client";

export interface ValorDominio {
  codigo: string;
  rotulo: string;
  descricao?: string;
}

/** rótulos PT por domínio (nome do enum). Ordem = ordem de exibição. */
export const DOMINIOS: Record<string, ValorDominio[]> = {
  StatusExperimento: [
    { codigo: "INSERINDO", rotulo: "Inserindo", descricao: "Em edição, antes de submeter." },
    { codigo: "APROVADO_CAD", rotulo: "Aprovado pelo CAD" },
    { codigo: "RECUSADO_CAD", rotulo: "Recusado pelo CAD" },
    { codigo: "EM_CONDUCAO", rotulo: "Em condução" },
    { codigo: "CONCLUIDO", rotulo: "Concluído" },
  ],
  Ensaio: [
    { codigo: "INTERNO", rotulo: "Interno", descricao: "TCC/ensaio sem custo." },
    { codigo: "COMERCIAL", rotulo: "Comercial", descricao: "Com orçamento e Ordem de Serviço." },
  ],
  Papel: [
    {
      codigo: "ADMIN_SISTEMA",
      rotulo: "Administrador do sistema",
      descricao: "Super-admin global.",
    },
    { codigo: "GESTAO_INSTITUICAO", rotulo: "Gestão da instituição" },
    { codigo: "GESTAO_DEPARTAMENTO", rotulo: "Gestão de departamento" },
    { codigo: "COORDENADOR_AREA", rotulo: "Coordenador de área/laboratório" },
    { codigo: "PESQUISADOR", rotulo: "Pesquisador" },
    { codigo: "ANALISTA", rotulo: "Analista" },
    { codigo: "ASSISTENTE", rotulo: "Assistente" },
  ],
  PoliticaAprovacao: [
    { codigo: "TODOS", rotulo: "Todos os aprovadores" },
    { codigo: "N_DE_M", rotulo: "N de M aprovadores" },
  ],
  TipoUnidade: [
    { codigo: "UNIDADE", rotulo: "Unidade" },
    { codigo: "LABORATORIO", rotulo: "Laboratório" },
  ],
  TipoFator: [
    { codigo: "QUALITATIVO", rotulo: "Qualitativo" },
    { codigo: "QUANTITATIVO", rotulo: "Quantitativo" },
  ],
  TipoAvaliacao: [
    { codigo: "CALENDARIZADA", rotulo: "Calendarizada" },
    { codigo: "CONDICIONAL", rotulo: "Condicional" },
  ],
  EscopoModelo: [
    { codigo: "SISTEMA", rotulo: "Geral (sistema)" },
    { codigo: "INSTITUICAO", rotulo: "Instituição" },
    { codigo: "DEPARTAMENTO", rotulo: "Departamento" },
  ],
  TipoAtividade: [
    { codigo: "ACAO", rotulo: "Ação", descricao: "Sem apontamento de campos." },
    { codigo: "APONTAMENTO", rotulo: "Apontamento", descricao: "Com campos parametrizados." },
  ],
  TipoPeriodo: [
    { codigo: "SAFRA", rotulo: "Safra" },
    { codigo: "ANO_SEMESTRE", rotulo: "Ano.semestre" },
  ],
  MarcoTipo: [
    { codigo: "IMPLANTACAO", rotulo: "Implantação" },
    { codigo: "INICIO", rotulo: "Início" },
    { codigo: "FIM", rotulo: "Encerramento" },
    { codigo: "SEMEADURA", rotulo: "Semeadura" },
    { codigo: "COLHEITA", rotulo: "Colheita" },
  ],
  TipoCampo: [
    { codigo: "NUMERO", rotulo: "Número" },
    { codigo: "TEXTO", rotulo: "Texto" },
    { codigo: "DATA", rotulo: "Data" },
    { codigo: "BOOLEANO", rotulo: "Booleano" },
  ],
  OrigemColeta: [
    { codigo: "WEB", rotulo: "Web" },
    { codigo: "MOBILE", rotulo: "Mobile" },
  ],
  NivelCompartilhamento: [
    {
      codigo: "INPUT",
      rotulo: "Inserção",
      descricao: "Pode lançar dados, não editar a estrutura.",
    },
    { codigo: "EDIT", rotulo: "Edição", descricao: "Pode editar a estrutura do experimento." },
  ],
  StatusOS: [
    { codigo: "RASCUNHO", rotulo: "Rascunho" },
    { codigo: "AGUARDANDO_APROVACAO_INTERNA", rotulo: "Aguardando aprovação interna" },
    { codigo: "AGUARDANDO_APROVACAO_CLIENTE", rotulo: "Aguardando aprovação do cliente" },
    { codigo: "APROVADA", rotulo: "Aprovada" },
    { codigo: "RECUSADA", rotulo: "Recusada" },
  ],
  Decisao: [
    { codigo: "PENDENTE", rotulo: "Pendente" },
    { codigo: "APROVADO", rotulo: "Aprovado" },
    { codigo: "RECUSADO", rotulo: "Recusado" },
  ],
  StatusEmail: [
    { codigo: "SIMULADO", rotulo: "Simulado" },
    { codigo: "ENVIADO", rotulo: "Enviado" },
    { codigo: "ERRO", rotulo: "Erro" },
  ],
  EsquemaCroqui: [
    { codigo: "FATORIAL", rotulo: "Fatorial", descricao: "Casualização livre dentro do bloco." },
    {
      codigo: "PARCELA_SUBDIVIDIDA",
      rotulo: "Parcela subdividida (split-plot)",
      descricao: "Fator principal na parcela principal, subfator na subparcela; dois erros.",
    },
  ],
};

/** Enums do Prisma por domínio — base do teste de cobertura (anti-órfão). */
const PRISMA_ENUMS: Record<string, Record<string, string>> = {
  StatusExperimento: Prisma.StatusExperimento,
  Ensaio: Prisma.Ensaio,
  Papel: Prisma.Papel,
  PoliticaAprovacao: Prisma.PoliticaAprovacao,
  TipoUnidade: Prisma.TipoUnidade,
  TipoFator: Prisma.TipoFator,
  TipoAvaliacao: Prisma.TipoAvaliacao,
  EscopoModelo: Prisma.EscopoModelo,
  TipoAtividade: Prisma.TipoAtividade,
  TipoPeriodo: Prisma.TipoPeriodo,
  MarcoTipo: Prisma.MarcoTipo,
  TipoCampo: Prisma.TipoCampo,
  OrigemColeta: Prisma.OrigemColeta,
  NivelCompartilhamento: Prisma.NivelCompartilhamento,
  StatusOS: Prisma.StatusOS,
  Decisao: Prisma.Decisao,
  StatusEmail: Prisma.StatusEmail,
  EsquemaCroqui: Prisma.EsquemaCroqui,
};

/**
 * Garante que todo valor de enum do Prisma tem rótulo no DOMINIOS e vice-versa.
 * Lança erro listando as divergências. Chamado no seed (e cobre o CI via e2e).
 */
export function validarCobertura(): void {
  const erros: string[] = [];
  for (const [dominio, enumObj] of Object.entries(PRISMA_ENUMS)) {
    const codigosPrisma = new Set(Object.values(enumObj));
    const codigosDic = new Set((DOMINIOS[dominio] ?? []).map((v) => v.codigo));
    for (const c of codigosPrisma)
      if (!codigosDic.has(c)) erros.push(`${dominio}.${c} sem rótulo em DOMINIOS`);
    for (const c of codigosDic)
      if (!codigosPrisma.has(c)) erros.push(`${dominio}.${c} em DOMINIOS não existe no enum`);
  }
  if (erros.length) throw new Error(`Cobertura de domínios incompleta:\n - ${erros.join("\n - ")}`);
}

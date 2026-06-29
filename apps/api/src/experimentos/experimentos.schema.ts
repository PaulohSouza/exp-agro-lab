import { z } from "zod";

export const criarExperimentoSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório"),
  objetivo: z.string().optional(),
  ensaio: z.enum(["INTERNO", "COMERCIAL"]).optional(),
  cultivar: z.string().optional(),
  objetoEstudoId: z.string().optional(),
  localId: z.string().optional(),
  safraId: z.string().optional(),
  areaPesquisaId: z.string().optional(),
  delineamentoId: z.string().optional(),
  parcelaLarguraM: z.number().optional(),
  parcelaComprimentoM: z.number().optional(),
  parcelaNumeroLinhas: z.number().int().optional(),
  espacamentoLinhasM: z.number().optional(),
  numeroRepeticoes: z.number().int().optional(),
});

export const atualizarExperimentoSchema = criarExperimentoSchema.partial().extend({
  titulo: z.string().min(1).optional(),
  codigo: z.string().optional(),
  metodologia: z.string().optional(),
  justificativa: z.string().optional(),
  observacoes: z.string().optional(),
  tipoExecucao: z.string().optional(),
  previsaoSemeadura: z.string().optional(),
  dataSemeadura: z.string().optional(),
  tipoPeriodo: z.enum(["SAFRA", "ANO_SEMESTRE"]).optional(),
  anoSemestre: z.string().optional(),
});

export const definirFatoresSchema = z.object({
  fatores: z.array(
    z.object({
      ordem: z.number().int(),
      nome: z.string().min(1, "Nome do fator obrigatório"),
      tipo: z.enum(["QUALITATIVO", "QUANTITATIVO"]).optional(),
      niveis: z.array(z.string()),
    }),
  ),
});

export const gerarCroquiSchema = z.object({
  delineamento: z.enum(["DIC", "DBC", "FATORIAL"]).optional(),
  blocos: z.number().int().optional(),
  seed: z.number().optional(),
  numeroInicial: z.number().int().optional(),
});

export const salvarCroquiSchema = z.object({
  parcelas: z.array(
    z.object({
      id: z.string(),
      tratamentoId: z.string(),
      bloco: z.number().int(),
      posicaoLinha: z.number().int(),
      posicaoColuna: z.number().int(),
      numero: z.number().int(),
      isInicio: z.boolean().optional(),
    }),
  ),
});

export const adicionarResponsavelSchema = z.object({ userId: z.string().min(1) });

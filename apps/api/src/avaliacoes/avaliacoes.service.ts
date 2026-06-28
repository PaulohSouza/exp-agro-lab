import { Injectable, NotFoundException } from "@nestjs/common";
import { calcularSaida } from "@exp/domain";
import { PrismaService } from "../prisma/prisma.service";

export interface CriarAvaliacaoDto {
  nome: string;
  metodologia?: string;
  unidadeColeta?: string;
  unidadeSaida?: string;
  formula?: string;
  tipo?: "calendarizada" | "condicional";
  personalizada?: boolean;
  escala?: string;
  timingId?: string;
  dataPrevista?: string;
  ordem?: number;
}

export interface LancarDadoDto {
  parcelaId: string;
  numAmostra?: number;
  valorColetado?: number;
  numLinhasColhidas?: number;
  comprimentoColhidoM?: number;
  areaUtilM2?: number;
  obs?: string;
  origem?: "web" | "mobile";
}

@Injectable()
export class AvaliacoesService {
  constructor(private readonly prisma: PrismaService) {}

  listar(experimentoId: string) {
    return this.prisma.avaliacao.findMany({
      where: { experimentoId },
      orderBy: { ordem: "asc" },
      include: { timing: true, _count: { select: { dados: true } } },
    });
  }

  async criar(experimentoId: string, dto: CriarAvaliacaoDto) {
    const exp = await this.prisma.experimento.findUnique({ where: { id: experimentoId } });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    const ordem =
      dto.ordem ?? (await this.prisma.avaliacao.count({ where: { experimentoId } })) + 1;
    return this.prisma.avaliacao.create({
      data: {
        experimentoId,
        nome: dto.nome,
        metodologia: dto.metodologia,
        unidadeColeta: dto.unidadeColeta,
        unidadeSaida: dto.unidadeSaida,
        formula: dto.formula,
        tipo: dto.tipo ?? "calendarizada",
        personalizada: dto.personalizada ?? false,
        escala: dto.escala,
        timingId: dto.timingId || null,
        dataPrevista: dto.dataPrevista ? new Date(dto.dataPrevista) : null,
        ordem,
      },
      include: { timing: true },
    });
  }

  async atualizar(id: string, dto: Partial<CriarAvaliacaoDto>) {
    return this.prisma.avaliacao.update({
      where: { id },
      data: {
        nome: dto.nome,
        metodologia: dto.metodologia,
        unidadeColeta: dto.unidadeColeta,
        unidadeSaida: dto.unidadeSaida,
        formula: dto.formula,
        tipo: dto.tipo,
        personalizada: dto.personalizada,
        escala: dto.escala,
        timingId: dto.timingId === undefined ? undefined : dto.timingId || null,
        dataPrevista: dto.dataPrevista ? new Date(dto.dataPrevista) : undefined,
      },
      include: { timing: true },
    });
  }

  async remover(id: string) {
    await this.prisma.avaliacaoDado.deleteMany({ where: { avaliacaoId: id } });
    await this.prisma.avaliacao.delete({ where: { id } });
    return { ok: true };
  }

  listarDados(avaliacaoId: string) {
    return this.prisma.avaliacaoDado.findMany({
      where: { avaliacaoId, deletedAt: null },
      include: { parcela: { include: { tratamento: true } } },
      orderBy: { parcela: { numero: "asc" } },
    });
  }

  /** Lança/atualiza o VALOR BRUTO por parcela (upsert idempotente). Sem cálculo aqui. */
  async lancar(avaliacaoId: string, dados: LancarDadoDto[]) {
    const aval = await this.prisma.avaliacao.findUnique({ where: { id: avaliacaoId } });
    if (!aval) throw new NotFoundException("Avaliação não encontrada.");
    for (const d of dados) {
      const numAmostra = d.numAmostra ?? 1;
      await this.prisma.avaliacaoDado.upsert({
        where: {
          avaliacaoId_parcelaId_numAmostra: { avaliacaoId, parcelaId: d.parcelaId, numAmostra },
        },
        create: {
          avaliacaoId,
          parcelaId: d.parcelaId,
          numAmostra,
          valorColetado: d.valorColetado,
          numLinhasColhidas: d.numLinhasColhidas,
          comprimentoColhidoM: d.comprimentoColhidoM,
          areaUtilM2: d.areaUtilM2,
          obs: d.obs,
          origem: d.origem ?? "web",
          syncedAt: new Date(),
        },
        update: {
          valorColetado: d.valorColetado,
          numLinhasColhidas: d.numLinhasColhidas,
          comprimentoColhidoM: d.comprimentoColhidoM,
          areaUtilM2: d.areaUtilM2,
          obs: d.obs,
          syncedAt: new Date(),
        },
      });
    }
    return this.listarDados(avaliacaoId);
  }

  /**
   * RELATÓRIO: a conversão para a unidade de saída acontece AQUI (não na coleta).
   * Para cada parcela calcula o valor de saída via fórmula; agrega média por tratamento.
   */
  async relatorio(avaliacaoId: string) {
    const aval = await this.prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: { experimento: true },
    });
    if (!aval) throw new NotFoundException("Avaliação não encontrada.");
    const dados = await this.listarDados(avaliacaoId);
    const espac = aval.experimento.espacamentoLinhasM ?? undefined;

    const linhas = dados.map((d) => {
      const areaUtil =
        d.areaUtilM2 ??
        (d.numLinhasColhidas && d.comprimentoColhidoM && espac
          ? d.numLinhasColhidas * espac * d.comprimentoColhidoM
          : undefined);
      let valorSaida: number | null = null;
      if (aval.formula && d.valorColetado != null) {
        try {
          valorSaida = calcularSaida({
            valorColetado: d.valorColetado,
            formula: aval.formula,
            params: areaUtil ? { areaUtil } : {},
          });
        } catch {
          valorSaida = null;
        }
      }
      return {
        parcela: d.parcela.numero,
        bloco: d.parcela.bloco,
        tratamento: d.parcela.tratamento?.tag ?? "",
        tratamentoNome: d.parcela.tratamento?.nome ?? "",
        valorColetado: d.valorColetado,
        areaUtilM2: areaUtil ?? null,
        valorSaida,
      };
    });

    // média por tratamento do valor de saída (prévia de análise)
    const porTrat = new Map<string, { soma: number; n: number; nome: string }>();
    for (const l of linhas) {
      if (l.valorSaida == null) continue;
      const cur = porTrat.get(l.tratamento) ?? { soma: 0, n: 0, nome: l.tratamentoNome };
      cur.soma += l.valorSaida;
      cur.n += 1;
      porTrat.set(l.tratamento, cur);
    }
    const medias = [...porTrat.entries()]
      .map(([tag, v]) => ({ tratamento: tag, nome: v.nome, media: v.soma / v.n }))
      .sort((a, b) => a.tratamento.localeCompare(b.tratamento));

    return {
      avaliacao: { nome: aval.nome, unidadeColeta: aval.unidadeColeta, unidadeSaida: aval.unidadeSaida, formula: aval.formula },
      linhas,
      medias,
    };
  }
}

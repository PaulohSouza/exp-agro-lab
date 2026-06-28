import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { gerarCroqui, type Delineamento, type TratamentoRef } from "@exp/domain";
import { PrismaService } from "../prisma/prisma.service";

export interface CriarExperimentoDto {
  titulo: string;
  objetivo?: string;
  ensaio?: "interno" | "comercial";
  cultivar?: string;
  objetoEstudoId?: string;
  localId?: string;
  safraId?: string;
  areaPesquisaId?: string;
  delineamentoId?: string;
  parcelaLarguraM?: number;
  parcelaComprimentoM?: number;
  parcelaNumLinhas?: number;
  espacamentoLinhasM?: number;
  numRepeticoes?: number;
  instituicaoId?: string;
  ownerId?: string;
}

export interface DefinirFatoresDto {
  fatores: Array<{
    ordem: number;
    nome: string;
    tipo?: "qualitativo" | "quantitativo";
    niveis: string[];
  }>;
}

@Injectable()
export class ExperimentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.experimento.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        objetoEstudo: true,
        local: true,
        safra: true,
        areaPesquisa: true,
        delineamento: true,
        _count: { select: { tratamentos: true, parcelas: true } },
      },
    });
  }

  async obter(id: string) {
    const exp = await this.prisma.experimento.findFirst({
      where: { id, deletedAt: null },
      include: {
        objetoEstudo: true,
        local: true,
        safra: true,
        areaPesquisa: true,
        delineamento: true,
        fatores: { include: { niveis: true }, orderBy: { ordem: "asc" } },
        tratamentos: {
          orderBy: { numeroRef: "asc" },
          include: {
            produtos: {
              orderBy: { seq: "asc" },
              include: { produto: true, timing: true, atividade: true },
            },
          },
        },
        parcelas: { orderBy: [{ posColuna: "asc" }, { posLinha: "asc" }] },
        avaliacoes: {
          orderBy: { ordem: "asc" },
          include: { timing: true, _count: { select: { dados: true } } },
        },
        timings: { orderBy: { ordem: "asc" } },
      },
    });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    return exp;
  }

  /** Atualiza os campos da aba Geral. */
  async atualizar(id: string, dto: Partial<CriarExperimentoDto> & {
    codigo?: string;
    metodologia?: string;
    justificativa?: string;
    observacoes?: string;
    tipoExecucao?: string;
    parcelaComprimentoM?: number;
    previsaoSemeadura?: string;
    dataSemeadura?: string;
  }) {
    const exp = await this.prisma.experimento.findFirst({ where: { id, deletedAt: null } });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    await this.prisma.experimento.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        codigo: dto.codigo,
        objetivo: dto.objetivo,
        ensaio: dto.ensaio,
        cultivar: dto.cultivar,
        tipoExecucao: dto.tipoExecucao,
        metodologia: dto.metodologia,
        justificativa: dto.justificativa,
        observacoes: dto.observacoes,
        objetoEstudoId: dto.objetoEstudoId === undefined ? undefined : dto.objetoEstudoId || null,
        localId: dto.localId === undefined ? undefined : dto.localId || null,
        safraId: dto.safraId === undefined ? undefined : dto.safraId || null,
        areaPesquisaId: dto.areaPesquisaId === undefined ? undefined : dto.areaPesquisaId || null,
        delineamentoId: dto.delineamentoId === undefined ? undefined : dto.delineamentoId || null,
        parcelaLarguraM: dto.parcelaLarguraM,
        parcelaComprimentoM: dto.parcelaComprimentoM,
        parcelaNumLinhas: dto.parcelaNumLinhas,
        espacamentoLinhasM: dto.espacamentoLinhasM,
        numRepeticoes: dto.numRepeticoes,
        previsaoSemeadura: dto.previsaoSemeadura ? new Date(dto.previsaoSemeadura) : undefined,
        dataSemeadura: dto.dataSemeadura ? new Date(dto.dataSemeadura) : undefined,
      },
    });
    return this.obter(id);
  }

  /** Defaults para o ambiente sem auth (Marco 1): usa a primeira instituição/usuário. */
  private async defaults() {
    const inst = await this.prisma.instituicao.findFirst();
    const user = inst
      ? await this.prisma.user.findFirst({ where: { instituicaoId: inst.id } })
      : null;
    return { instituicaoId: inst?.id, ownerId: user?.id };
  }

  async criar(dto: CriarExperimentoDto) {
    const def = await this.defaults();
    const instituicaoId = dto.instituicaoId ?? def.instituicaoId;
    const ownerId = dto.ownerId ?? def.ownerId;
    if (!instituicaoId || !ownerId) {
      throw new BadRequestException(
        "instituicaoId/ownerId ausentes e sem defaults no banco (rode o seed).",
      );
    }
    return this.prisma.experimento.create({
      data: {
        titulo: dto.titulo,
        objetivo: dto.objetivo,
        ensaio: dto.ensaio ?? "interno",
        cultivar: dto.cultivar,
        objetoEstudoId: dto.objetoEstudoId,
        localId: dto.localId,
        safraId: dto.safraId,
        areaPesquisaId: dto.areaPesquisaId,
        delineamentoId: dto.delineamentoId,
        parcelaLarguraM: dto.parcelaLarguraM,
        parcelaComprimentoM: dto.parcelaComprimentoM,
        parcelaNumLinhas: dto.parcelaNumLinhas,
        espacamentoLinhasM: dto.espacamentoLinhasM,
        numRepeticoes: dto.numRepeticoes,
        instituicaoId,
        ownerId,
      },
    });
  }

  /** Define fatores/níveis e DERIVA os tratamentos (produto cartesiano dos níveis). */
  async definirFatores(id: string, dto: DefinirFatoresDto) {
    const exp = await this.prisma.experimento.findUnique({ where: { id } });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    if (!dto.fatores?.length) throw new BadRequestException("Informe ao menos 1 fator.");
    if (dto.fatores.length > 3) throw new BadRequestException("Máximo de 3 fatores.");
    for (const f of dto.fatores) {
      if (!f.niveis?.length) throw new BadRequestException(`Fator '${f.nome}' sem níveis.`);
    }

    // limpa estrutura anterior (dados de avaliação, parcelas, tratamentos, fatores)
    await this.prisma.avaliacaoDado.deleteMany({ where: { parcela: { experimentoId: id } } });
    await this.prisma.parcela.deleteMany({ where: { experimentoId: id } });
    await this.prisma.tratamento.deleteMany({ where: { experimentoId: id } });
    await this.prisma.fator.deleteMany({ where: { experimentoId: id } });

    const fatoresOrdenados = [...dto.fatores].sort((a, b) => a.ordem - b.ordem);
    for (const f of fatoresOrdenados) {
      await this.prisma.fator.create({
        data: {
          experimentoId: id,
          ordem: f.ordem,
          nome: f.nome,
          tipo: f.tipo ?? "qualitativo",
          niveis: { create: f.niveis.map((v) => ({ valor: v })) },
        },
      });
    }

    // produto cartesiano dos níveis → tratamentos
    const combos = cartesiano(fatoresOrdenados.map((f) => f.niveis));
    let n = 1;
    for (const combo of combos) {
      await this.prisma.tratamento.create({
        data: {
          experimentoId: id,
          numeroRef: n,
          tag: `T${n}`,
          nome: combo.join(" + "),
        },
      });
      n++;
    }

    await this.prisma.experimento.update({
      where: { id },
      data: { numTratamentos: combos.length },
    });

    return this.obter(id);
  }

  /** Gera o croqui a partir do delineamento e dos tratamentos (núcleo de domínio). */
  async gerarCroqui(id: string, opts: { delineamento?: Delineamento; blocos?: number; seed?: number; numeroInicial?: number }) {
    const exp = await this.prisma.experimento.findUnique({
      where: { id },
      include: { tratamentos: { orderBy: { numeroRef: "asc" } }, delineamento: true },
    });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    if (!exp.tratamentos.length) throw new BadRequestException("Defina os fatores/tratamentos antes do croqui.");

    const delineamento = opts.delineamento ?? mapDelineamento(exp.delineamento?.nome);
    const blocos = opts.blocos ?? exp.numRepeticoes ?? 4;
    const trats: TratamentoRef[] = exp.tratamentos.map((t) => ({ id: t.id, numeroRef: t.numeroRef }));

    const croqui = gerarCroqui(delineamento, trats, blocos, {
      seed: opts.seed ?? 1,
      numeroInicial: opts.numeroInicial ?? 1,
    });

    // regenerar o croqui descarta lançamentos atrelados às parcelas antigas
    await this.prisma.avaliacaoDado.deleteMany({ where: { parcela: { experimentoId: id } } });
    await this.prisma.parcela.deleteMany({ where: { experimentoId: id } });
    await this.prisma.parcela.createMany({
      data: croqui.parcelas.map((p) => ({
        experimentoId: id,
        tratamentoId: p.tratamentoId,
        bloco: p.bloco,
        numero: p.numero,
        posLinha: p.posLinha,
        posColuna: p.posColuna,
        isInicio: p.isInicio,
      })),
    });
    await this.prisma.experimento.update({
      where: { id },
      data: { numRepeticoes: blocos, totalParcelas: croqui.parcelas.length },
    });

    return this.obter(id);
  }

  /** Salva o layout editado (drag-drop): lista de parcelas com posição/tratamento. */
  async salvarCroqui(id: string, parcelas: Array<{ id: string; tratamentoId: string; bloco: number; posLinha: number; posColuna: number; numero: number; isInicio?: boolean }>) {
    const exp = await this.prisma.experimento.findUnique({ where: { id } });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    await this.prisma.$transaction(
      parcelas.map((p) =>
        this.prisma.parcela.update({
          where: { id: p.id },
          data: {
            tratamentoId: p.tratamentoId,
            bloco: p.bloco,
            posLinha: p.posLinha,
            posColuna: p.posColuna,
            numero: p.numero,
            isInicio: p.isInicio ?? false,
          },
        }),
      ),
    );
    return this.obter(id);
  }
}

function cartesiano(listas: string[][]): string[][] {
  return listas.reduce<string[][]>(
    (acc, lista) => acc.flatMap((pref) => lista.map((v) => [...pref, v])),
    [[]],
  );
}

function mapDelineamento(nome?: string | null): Delineamento {
  const n = (nome ?? "").toUpperCase();
  if (n.includes("DBC") || n.includes("BLOCO")) return "DBC";
  if (n.includes("FATOR")) return "FATORIAL";
  return "DIC";
}

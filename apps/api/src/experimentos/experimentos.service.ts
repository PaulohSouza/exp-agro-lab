import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { gerarCroqui, type Delineamento, type TratamentoRef } from "@exp/domain";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

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
}

export interface AtualizarExperimentoDto extends Partial<CriarExperimentoDto> {
  codigo?: string;
  metodologia?: string;
  justificativa?: string;
  observacoes?: string;
  tipoExecucao?: string;
  previsaoSemeadura?: string;
  dataSemeadura?: string;
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

  /** Lista experimentos da instituição do usuário (+ compartilhados — etapa C). */
  async listar(user: UsuarioAtual) {
    // super-admin global: enxerga todas as instituições (RN-RBAC).
    if (user.papel === "admin_sistema") {
      const todos = await this.prisma.experimento.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          objetoEstudo: true, local: true, safra: true, areaPesquisa: true, delineamento: true,
          instituicao: { select: { nome: true } },
          owner: { select: { id: true, nome: true } },
          _count: { select: { tratamentos: true, parcelas: true } },
        },
      });
      return todos.map((e) => ({ ...e, compartilhadoComigo: false }));
    }
    const proprios = await this.prisma.experimento.findMany({
      where: { deletedAt: null, instituicaoId: user.instituicaoId },
      orderBy: { createdAt: "desc" },
      include: {
        objetoEstudo: true,
        local: true,
        safra: true,
        areaPesquisa: true,
        delineamento: true,
        owner: { select: { id: true, nome: true } },
        _count: { select: { tratamentos: true, parcelas: true } },
      },
    });
    const compartilhados = await this.prisma.experimento.findMany({
      where: {
        deletedAt: null,
        instituicaoId: { not: user.instituicaoId },
        compartilhamentos: { some: { userId: user.userId } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        objetoEstudo: true, local: true, safra: true, areaPesquisa: true, delineamento: true,
        owner: { select: { id: true, nome: true } },
        _count: { select: { tratamentos: true, parcelas: true } },
      },
    });
    return [
      ...proprios.map((e) => ({ ...e, compartilhadoComigo: false })),
      ...compartilhados.map((e) => ({ ...e, compartilhadoComigo: true })),
    ];
  }

  /** Verifica acesso do usuário ao experimento. Retorna o nível: own | edit | input. */
  async garantirAcesso(id: string, user: UsuarioAtual, exigir?: "edit"): Promise<"own" | "edit" | "input"> {
    const exp = await this.prisma.experimento.findFirst({
      where: { id, deletedAt: null },
      select: {
        instituicaoId: true,
        ownerId: true,
        compartilhamentos: { where: { userId: user.userId }, select: { nivel: true } },
      },
    });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");

    let nivel: "own" | "edit" | "input" | null = null;
    if (user.papel === "admin_sistema") nivel = "own"; // super-admin global (RN-RBAC)
    else if (exp.instituicaoId === user.instituicaoId) nivel = "own";
    else if (exp.compartilhamentos.length) nivel = exp.compartilhamentos[0].nivel === "edit" ? "edit" : "input";

    if (!nivel) throw new ForbiddenException("Sem acesso a este experimento.");
    if (exigir === "edit" && nivel === "input") {
      throw new ForbiddenException("Permissão apenas de inserção de dados (input).");
    }
    return nivel;
  }

  // ── Responsáveis pela coleta (RN-RBAC) ──────────────────────────────────────

  async listarResponsaveis(id: string, user: UsuarioAtual) {
    await this.garantirAcesso(id, user);
    return this.prisma.experimentoResponsavel.findMany({
      where: { experimentoId: id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, nome: true, email: true, papel: true } } },
    });
  }

  async adicionarResponsavel(id: string, user: UsuarioAtual, userId: string) {
    await this.garantirAcesso(id, user, "edit");
    const exp = await this.prisma.experimento.findUnique({ where: { id }, select: { instituicaoId: true } });
    const alvo = await this.prisma.user.findUnique({ where: { id: userId }, select: { instituicaoId: true } });
    if (!exp || !alvo) throw new NotFoundException("Experimento ou usuário não encontrado.");
    if (alvo.instituicaoId !== exp.instituicaoId) {
      throw new BadRequestException("O responsável deve pertencer à instituição do experimento.");
    }
    return this.prisma.experimentoResponsavel.upsert({
      where: { experimentoId_userId: { experimentoId: id, userId } },
      create: { experimentoId: id, userId },
      update: {},
      include: { user: { select: { id: true, nome: true, email: true, papel: true } } },
    });
  }

  async removerResponsavel(id: string, user: UsuarioAtual, userId: string) {
    await this.garantirAcesso(id, user, "edit");
    await this.prisma.experimentoResponsavel.deleteMany({ where: { experimentoId: id, userId } });
    return { ok: true };
  }

  async obter(id: string, user: UsuarioAtual) {
    await this.garantirAcesso(id, user);
    return this.carregar(id);
  }

  private async carregar(id: string) {
    const exp = await this.prisma.experimento.findFirst({
      where: { id, deletedAt: null },
      include: {
        objetoEstudo: true,
        local: true,
        safra: true,
        areaPesquisa: true,
        delineamento: true,
        owner: { select: { id: true, nome: true } },
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
        compartilhamentos: { include: { user: { select: { id: true, nome: true, email: true } } } },
      },
    });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    return exp;
  }

  async criar(user: UsuarioAtual, dto: CriarExperimentoDto) {
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
        instituicaoId: user.instituicaoId,
        ownerId: user.userId,
      },
    });
  }

  async atualizar(id: string, user: UsuarioAtual, dto: AtualizarExperimentoDto) {
    await this.garantirAcesso(id, user, "edit");
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
    return this.carregar(id);
  }

  /** Define fatores/níveis e DERIVA os tratamentos (produto cartesiano dos níveis). */
  async definirFatores(id: string, user: UsuarioAtual, dto: DefinirFatoresDto) {
    await this.garantirAcesso(id, user, "edit");
    if (!dto.fatores?.length) throw new BadRequestException("Informe ao menos 1 fator.");
    if (dto.fatores.length > 3) throw new BadRequestException("Máximo de 3 fatores.");
    for (const f of dto.fatores) {
      if (!f.niveis?.length) throw new BadRequestException(`Fator '${f.nome}' sem níveis.`);
    }

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

    const combos = cartesiano(fatoresOrdenados.map((f) => f.niveis));
    let n = 1;
    for (const combo of combos) {
      await this.prisma.tratamento.create({
        data: { experimentoId: id, numeroRef: n, tag: `T${n}`, nome: combo.join(" + ") },
      });
      n++;
    }

    await this.prisma.experimento.update({ where: { id }, data: { numTratamentos: combos.length } });
    return this.carregar(id);
  }

  /** Gera o croqui a partir do delineamento e dos tratamentos (núcleo de domínio). */
  async gerarCroqui(
    id: string,
    user: UsuarioAtual,
    opts: { delineamento?: Delineamento; blocos?: number; seed?: number; numeroInicial?: number },
  ) {
    await this.garantirAcesso(id, user, "edit");
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

    return this.carregar(id);
  }

  /** Salva o layout editado (drag-drop). Exige nível edit. */
  async salvarCroqui(
    id: string,
    user: UsuarioAtual,
    parcelas: Array<{ id: string; tratamentoId: string; bloco: number; posLinha: number; posColuna: number; numero: number; isInicio?: boolean }>,
  ) {
    await this.garantirAcesso(id, user, "edit");
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
    return this.carregar(id);
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

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { podeGerenciarEscopo, type EscopoModelo, type PapelGestao } from "@exp/domain";
import type { UsuarioAtual } from "../auth/jwt.strategy";

interface ModeloDto {
  nome: string;
  descricaoColeta?: string;
  numeroPontos?: number;
  metodologiaRelatorio?: string;
  unidadeColeta?: string;
  unidadeSaida?: string;
  calculoRelatorio?: string;
  escopo: EscopoModelo;
  departamentoId?: string; // exigido quando escopo = departamento
  baseadoEmId?: string;
  prerequisitoIds?: string[];
}

@Injectable()
export class ModeloAvaliacaoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Departamento do usuário logado (não vem no JWT). */
  private async departamentoDoUsuario(user: UsuarioAtual): Promise<string | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { departamentoId: true },
    });
    return u?.departamentoId ?? null;
  }

  /**
   * Modelos visíveis para o usuário: padrão do sistema + da instituição + do seu
   * departamento. Super-admin vê todos. Regra espelha `modelosVisiveis` do domínio.
   */
  async listar(user: UsuarioAtual) {
    const departamentoId = await this.departamentoDoUsuario(user);
    const where =
      user.papel === "admin_sistema"
        ? {}
        : {
            OR: [
              { escopo: "sistema" as const },
              { escopo: "instituicao" as const, instituicaoId: user.instituicaoId },
              ...(departamentoId
                ? [{ escopo: "departamento" as const, departamentoId }]
                : []),
            ],
          };
    return this.prisma.modeloAvaliacao.findMany({
      where: { ...where, ativo: true },
      orderBy: [{ escopo: "asc" }, { nome: "asc" }],
      include: {
        prerequisitos: { include: { prerequisito: { select: { id: true, nome: true } } } },
        _count: { select: { avaliacoes: true } },
      },
    });
  }

  async criar(user: UsuarioAtual, dto: ModeloDto) {
    this.exigirGestao(user.papel, dto.escopo);
    const { instituicaoId, departamentoId } = await this.donoDoEscopo(user, dto);
    await this.validarPrerequisitos(dto.prerequisitoIds);

    return this.prisma.modeloAvaliacao.create({
      data: {
        nome: dto.nome,
        descricaoColeta: dto.descricaoColeta,
        numeroPontos: dto.numeroPontos ?? 1,
        metodologiaRelatorio: dto.metodologiaRelatorio,
        unidadeColeta: dto.unidadeColeta,
        unidadeSaida: dto.unidadeSaida,
        calculoRelatorio: dto.calculoRelatorio,
        escopo: dto.escopo,
        instituicaoId,
        departamentoId,
        baseadoEmId: dto.baseadoEmId,
        prerequisitos: dto.prerequisitoIds?.length
          ? { create: dto.prerequisitoIds.map((prerequisitoId) => ({ prerequisitoId })) }
          : undefined,
      },
      include: { prerequisitos: { include: { prerequisito: { select: { id: true, nome: true } } } } },
    });
  }

  async atualizar(user: UsuarioAtual, id: string, dto: Partial<ModeloDto>) {
    await this.garantirAcesso(user, id);
    if (dto.prerequisitoIds) await this.validarPrerequisitos(dto.prerequisitoIds, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.prerequisitoIds) {
        await tx.modeloAvaliacaoPrereq.deleteMany({ where: { modeloId: id } });
        if (dto.prerequisitoIds.length) {
          await tx.modeloAvaliacaoPrereq.createMany({
            data: dto.prerequisitoIds.map((prerequisitoId) => ({ modeloId: id, prerequisitoId })),
          });
        }
      }
      return tx.modeloAvaliacao.update({
        where: { id },
        data: {
          nome: dto.nome,
          descricaoColeta: dto.descricaoColeta,
          numeroPontos: dto.numeroPontos,
          metodologiaRelatorio: dto.metodologiaRelatorio,
          unidadeColeta: dto.unidadeColeta,
          unidadeSaida: dto.unidadeSaida,
          calculoRelatorio: dto.calculoRelatorio,
          baseadoEmId: dto.baseadoEmId,
          // escopo/dono não mudam após criado
        },
        include: { prerequisitos: { include: { prerequisito: { select: { id: true, nome: true } } } } },
      });
    });
  }

  async remover(user: UsuarioAtual, id: string) {
    await this.garantirAcesso(user, id);
    await this.prisma.modeloAvaliacao.update({ where: { id }, data: { ativo: false } });
    return { ok: true };
  }

  /* ----------------------------- helpers ----------------------------- */

  private exigirGestao(papel: string, escopo: EscopoModelo) {
    if (!podeGerenciarEscopo(papel as PapelGestao, escopo)) {
      throw new ForbiddenException(`Seu papel não pode gerir modelos de escopo '${escopo}'.`);
    }
  }

  /** Resolve e valida os donos (instituição/departamento) conforme o escopo. */
  private async donoDoEscopo(user: UsuarioAtual, dto: ModeloDto) {
    if (dto.escopo === "sistema") return { instituicaoId: null, departamentoId: null };
    if (dto.escopo === "instituicao") return { instituicaoId: user.instituicaoId, departamentoId: null };
    // departamento
    if (!dto.departamentoId) throw new BadRequestException("departamentoId é obrigatório no escopo de departamento.");
    const depto = await this.prisma.departamento.findUnique({
      where: { id: dto.departamentoId },
      select: { instituicaoId: true },
    });
    if (!depto) throw new NotFoundException("Departamento não encontrado.");
    if (depto.instituicaoId !== user.instituicaoId && user.papel !== "admin_sistema") {
      throw new ForbiddenException("Departamento de outra instituição.");
    }
    return { instituicaoId: depto.instituicaoId, departamentoId: dto.departamentoId };
  }

  private async validarPrerequisitos(ids: string[] | undefined, selfId?: string) {
    if (!ids?.length) return;
    if (selfId && ids.includes(selfId)) throw new BadRequestException("Um modelo não pode ser pré-requisito de si mesmo.");
    const achados = await this.prisma.modeloAvaliacao.count({ where: { id: { in: ids } } });
    if (achados !== new Set(ids).size) throw new BadRequestException("Pré-requisito inexistente.");
  }

  /** Carrega o modelo e confere papel + posse para gestão. */
  private async garantirAcesso(user: UsuarioAtual, id: string) {
    const m = await this.prisma.modeloAvaliacao.findUnique({
      where: { id },
      select: { id: true, escopo: true, instituicaoId: true },
    });
    if (!m) throw new NotFoundException("Modelo não encontrado.");
    this.exigirGestao(user.papel, m.escopo);
    if (m.escopo !== "sistema" && m.instituicaoId !== user.instituicaoId && user.papel !== "admin_sistema") {
      throw new ForbiddenException("Modelo de outra instituição.");
    }
    return m;
  }
}

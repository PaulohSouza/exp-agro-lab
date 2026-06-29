import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { podeGerenciarEscopo, type EscopoModelo, type PapelGestao } from "@exp/domain";
import type { UsuarioAtual } from "../auth/jwt.strategy";

interface GrupoDto {
  nome: string;
  descricao?: string;
  escopo: EscopoModelo;
  departamentoId?: string;
  modeloIds?: string[]; // modelos de avaliação do conjunto
}

@Injectable()
export class GruposColetaService {
  constructor(private readonly prisma: PrismaService) {}

  private async departamentoDoUsuario(user: UsuarioAtual): Promise<string | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { departamentoId: true },
    });
    return u?.departamentoId ?? null;
  }

  async listar(user: UsuarioAtual) {
    const departamentoId = await this.departamentoDoUsuario(user);
    const where =
      user.papel === "admin_sistema"
        ? {}
        : {
            OR: [
              { escopo: "sistema" as const },
              { escopo: "instituicao" as const, instituicaoId: user.instituicaoId },
              ...(departamentoId ? [{ escopo: "departamento" as const, departamentoId }] : []),
            ],
          };
    return this.prisma.grupoColeta.findMany({
      where: { ...where, isAtivo: true },
      orderBy: [{ escopo: "asc" }, { nome: "asc" }],
      include: {
        itens: {
          include: { modelo: { select: { id: true, nome: true } } },
          orderBy: { ordem: "asc" },
        },
      },
    });
  }

  async criar(user: UsuarioAtual, dto: GrupoDto) {
    this.exigirGestao(user.papel, dto.escopo);
    const { instituicaoId, departamentoId } = await this.donoDoEscopo(user, dto);
    return this.prisma.grupoColeta.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        escopo: dto.escopo,
        instituicaoId,
        departamentoId,
        itens: dto.modeloIds?.length
          ? { create: dto.modeloIds.map((modeloId, i) => ({ modeloId, ordem: i })) }
          : undefined,
      },
      include: { itens: { include: { modelo: { select: { id: true, nome: true } } } } },
    });
  }

  async atualizar(user: UsuarioAtual, id: string, dto: Partial<GrupoDto>) {
    await this.garantirAcesso(user, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.modeloIds) {
        await tx.grupoColetaItem.deleteMany({ where: { grupoId: id } });
        if (dto.modeloIds.length) {
          await tx.grupoColetaItem.createMany({
            data: dto.modeloIds.map((modeloId, i) => ({ grupoId: id, modeloId, ordem: i })),
          });
        }
      }
      return tx.grupoColeta.update({
        where: { id },
        data: { nome: dto.nome, descricao: dto.descricao },
        include: { itens: { include: { modelo: { select: { id: true, nome: true } } } } },
      });
    });
  }

  async remover(user: UsuarioAtual, id: string) {
    await this.garantirAcesso(user, id);
    await this.prisma.grupoColeta.update({ where: { id }, data: { isAtivo: false } });
    return { ok: true };
  }

  private exigirGestao(papel: string, escopo: EscopoModelo) {
    if (!podeGerenciarEscopo(papel as PapelGestao, escopo)) {
      throw new ForbiddenException(`Seu papel não pode gerir grupos de escopo '${escopo}'.`);
    }
  }

  private async donoDoEscopo(user: UsuarioAtual, dto: GrupoDto) {
    if (dto.escopo === "sistema") return { instituicaoId: null, departamentoId: null };
    if (dto.escopo === "instituicao")
      return { instituicaoId: user.instituicaoId, departamentoId: null };
    if (!dto.departamentoId)
      throw new BadRequestException("departamentoId é obrigatório no escopo de departamento.");
    const depto = await this.prisma.departamento.findUnique({
      where: { id: dto.departamentoId },
      select: { instituicaoId: true },
    });
    if (!depto) throw new NotFoundException("Departamento não encontrado.");
    if (depto.instituicaoId !== user.instituicaoId && user.papel !== "admin_sistema")
      throw new ForbiddenException("Departamento de outra instituição.");
    return { instituicaoId: depto.instituicaoId, departamentoId: dto.departamentoId };
  }

  private async garantirAcesso(user: UsuarioAtual, id: string) {
    const g = await this.prisma.grupoColeta.findUnique({
      where: { id },
      select: { escopo: true, instituicaoId: true },
    });
    if (!g) throw new NotFoundException("Grupo não encontrado.");
    this.exigirGestao(user.papel, g.escopo);
    if (
      g.escopo !== "sistema" &&
      g.instituicaoId !== user.instituicaoId &&
      user.papel !== "admin_sistema"
    ) {
      throw new ForbiddenException("Grupo de outra instituição.");
    }
  }
}

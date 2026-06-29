import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  podeGerenciarEscopo,
  type EscopoModelo,
  type PapelGestao,
  type TipoAtividade,
  type TipoCampo,
} from "@exp/domain";
import type { UsuarioAtual } from "../auth/jwt.strategy";

interface CampoDto {
  rotulo: string;
  tipo?: TipoCampo;
  unidade?: string;
  isObrigatorio?: boolean;
  ordem?: number;
}
interface ModeloAtividadeDto {
  nome: string;
  descricao?: string;
  tipo: TipoAtividade;
  metodologiaRelatorio?: string;
  escopo: EscopoModelo;
  departamentoId?: string;
  campos?: CampoDto[];
}

@Injectable()
export class ModeloAtividadeService {
  constructor(private readonly prisma: PrismaService) {}

  private async departamentoDoUsuario(user: UsuarioAtual): Promise<string | null> {
    const u = await this.prisma.usuario.findUnique({
      where: { id: user.userId },
      select: { departamentoId: true },
    });
    return u?.departamentoId ?? null;
  }

  /** Modelos de atividade visíveis: sistema + instituição + departamento do usuário. */
  async listar(user: UsuarioAtual) {
    const departamentoId = await this.departamentoDoUsuario(user);
    const where =
      user.papel === "ADMIN_SISTEMA"
        ? {}
        : {
            OR: [
              { escopo: "SISTEMA" as const },
              { escopo: "INSTITUICAO" as const, instituicaoId: user.instituicaoId },
              ...(departamentoId ? [{ escopo: "DEPARTAMENTO" as const, departamentoId }] : []),
            ],
          };
    return this.prisma.modeloAtividade.findMany({
      where: { ...where, isAtivo: true },
      orderBy: [{ escopo: "asc" }, { nome: "asc" }],
      include: { campos: { orderBy: { ordem: "asc" } }, _count: { select: { atividades: true } } },
    });
  }

  async criar(user: UsuarioAtual, dto: ModeloAtividadeDto) {
    this.exigirGestao(user.papel, dto.escopo);
    const { instituicaoId, departamentoId } = await this.donoDoEscopo(user, dto);
    return this.prisma.modeloAtividade.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        tipo: dto.tipo ?? "ACAO",
        metodologiaRelatorio: dto.metodologiaRelatorio,
        escopo: dto.escopo,
        instituicaoId,
        departamentoId,
        campos:
          dto.tipo === "APONTAMENTO" && dto.campos?.length
            ? {
                create: dto.campos.map((c, i) => ({
                  rotulo: c.rotulo,
                  tipo: c.tipo ?? "NUMERO",
                  unidade: c.unidade,
                  isObrigatorio: c.isObrigatorio ?? false,
                  ordem: c.ordem ?? i,
                })),
              }
            : undefined,
      },
      include: { campos: { orderBy: { ordem: "asc" } } },
    });
  }

  async atualizar(user: UsuarioAtual, id: string, dto: Partial<ModeloAtividadeDto>) {
    await this.garantirAcesso(user, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.campos) {
        await tx.modeloAtividadeCampo.deleteMany({ where: { modeloId: id } });
        if (dto.campos.length) {
          await tx.modeloAtividadeCampo.createMany({
            data: dto.campos.map((c, i) => ({
              modeloId: id,
              rotulo: c.rotulo,
              tipo: c.tipo ?? "NUMERO",
              unidade: c.unidade,
              isObrigatorio: c.isObrigatorio ?? false,
              ordem: c.ordem ?? i,
            })),
          });
        }
      }
      return tx.modeloAtividade.update({
        where: { id },
        data: {
          nome: dto.nome,
          descricao: dto.descricao,
          tipo: dto.tipo,
          metodologiaRelatorio: dto.metodologiaRelatorio,
        },
        include: { campos: { orderBy: { ordem: "asc" } } },
      });
    });
  }

  async remover(user: UsuarioAtual, id: string) {
    await this.garantirAcesso(user, id);
    await this.prisma.modeloAtividade.update({ where: { id }, data: { isAtivo: false } });
    return { ok: true };
  }

  /* helpers (espelham modelo-avaliacao) */

  private exigirGestao(papel: string, escopo: EscopoModelo) {
    if (!podeGerenciarEscopo(papel as PapelGestao, escopo)) {
      throw new ForbiddenException(`Seu papel não pode gerir atividades de escopo '${escopo}'.`);
    }
  }

  private async donoDoEscopo(user: UsuarioAtual, dto: ModeloAtividadeDto) {
    if (dto.escopo === "SISTEMA") return { instituicaoId: null, departamentoId: null };
    if (dto.escopo === "INSTITUICAO")
      return { instituicaoId: user.instituicaoId, departamentoId: null };
    if (!dto.departamentoId)
      throw new BadRequestException("departamentoId é obrigatório no escopo de departamento.");
    const depto = await this.prisma.departamento.findUnique({
      where: { id: dto.departamentoId },
      select: { instituicaoId: true },
    });
    if (!depto) throw new NotFoundException("Departamento não encontrado.");
    if (depto.instituicaoId !== user.instituicaoId && user.papel !== "ADMIN_SISTEMA") {
      throw new ForbiddenException("Departamento de outra instituição.");
    }
    return { instituicaoId: depto.instituicaoId, departamentoId: dto.departamentoId };
  }

  private async garantirAcesso(user: UsuarioAtual, id: string) {
    const m = await this.prisma.modeloAtividade.findUnique({
      where: { id },
      select: { id: true, escopo: true, instituicaoId: true },
    });
    if (!m) throw new NotFoundException("Modelo de atividade não encontrado.");
    this.exigirGestao(user.papel, m.escopo);
    if (
      m.escopo !== "SISTEMA" &&
      m.instituicaoId !== user.instituicaoId &&
      user.papel !== "ADMIN_SISTEMA"
    ) {
      throw new ForbiddenException("Modelo de outra instituição.");
    }
    return m;
  }
}

import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Injectable()
export class InstituicaoService {
  constructor(private readonly prisma: PrismaService) {}

  obter(user: UsuarioAtual) {
    return this.prisma.instituicao.findUnique({ where: { id: user.instituicaoId } });
  }

  async atualizar(
    user: UsuarioAtual,
    dto: { politicaAprovacao?: "todos" | "n_de_m"; nAprovadores?: number },
  ) {
    this.exigirAdmin(user);
    return this.prisma.instituicao.update({
      where: { id: user.instituicaoId },
      data: {
        politicaAprovacao: dto.politicaAprovacao,
        nAprovadores: dto.nAprovadores != null ? Math.max(1, dto.nAprovadores) : undefined,
      },
    });
  }

  listarAprovadores(user: UsuarioAtual) {
    return this.prisma.aprovadorInstituicao.findMany({
      where: { instituicaoId: user.instituicaoId },
      include: { user: { select: { id: true, nome: true, email: true } } },
    });
  }

  async adicionarAprovador(user: UsuarioAtual, dto: { userId: string }) {
    this.exigirAdmin(user);
    const alvo = await this.prisma.user.findFirst({
      where: { id: dto.userId, instituicaoId: user.instituicaoId },
    });
    if (!alvo) throw new BadRequestException("Usuário não pertence à instituição.");
    const existe = await this.prisma.aprovadorInstituicao.findFirst({
      where: { instituicaoId: user.instituicaoId, userId: dto.userId },
    });
    if (existe) {
      return this.prisma.aprovadorInstituicao.update({
        where: { id: existe.id },
        data: { isAtivo: true },
      });
    }
    return this.prisma.aprovadorInstituicao.create({
      data: { instituicaoId: user.instituicaoId, userId: dto.userId },
    });
  }

  async removerAprovador(user: UsuarioAtual, id: string) {
    this.exigirAdmin(user);
    const ap = await this.prisma.aprovadorInstituicao.findUnique({ where: { id } });
    if (!ap || ap.instituicaoId !== user.instituicaoId)
      throw new NotFoundException("Aprovador não encontrado.");
    await this.prisma.aprovadorInstituicao.delete({ where: { id } });
    return { ok: true };
  }

  private exigirAdmin(user: UsuarioAtual) {
    if (!user.isAdminInstituicao) throw new ForbiddenException("Apenas o admin da instituição.");
  }
}

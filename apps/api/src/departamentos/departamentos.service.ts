import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Injectable()
export class DepartamentosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(user: UsuarioAtual) {
    return this.prisma.departamento.findMany({
      where: { instituicaoId: user.instituicaoId },
      orderBy: { nome: "asc" },
      include: { _count: { select: { unidades: true, usuarios: true } } },
    });
  }

  /** Unidades/laboratórios da instituição (para atribuir coordenador de área). */
  listarUnidades(user: UsuarioAtual) {
    return this.prisma.unidade.findMany({
      where: { instituicaoId: user.instituicaoId },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, tipo: true, departamentoId: true },
    });
  }

  criar(user: UsuarioAtual, dto: { nome: string }) {
    return this.prisma.departamento.create({
      data: { instituicaoId: user.instituicaoId, nome: dto.nome },
    });
  }

  async atualizar(user: UsuarioAtual, id: string, dto: { nome?: string; ativo?: boolean }) {
    await this.garantir(user, id);
    return this.prisma.departamento.update({
      where: { id },
      data: { nome: dto.nome, ativo: dto.ativo },
    });
  }

  /** Desativa (soft) — preserva vínculos de unidades/usuários. */
  async desativar(user: UsuarioAtual, id: string) {
    await this.garantir(user, id);
    await this.prisma.departamento.update({ where: { id }, data: { ativo: false } });
    return { ok: true };
  }

  private async garantir(user: UsuarioAtual, id: string) {
    const d = await this.prisma.departamento.findUnique({
      where: { id },
      select: { instituicaoId: true },
    });
    if (!d) throw new NotFoundException("Departamento não encontrado.");
    if (d.instituicaoId !== user.instituicaoId && user.papel !== "admin_sistema") {
      throw new ForbiddenException("Departamento de outra instituição.");
    }
  }
}

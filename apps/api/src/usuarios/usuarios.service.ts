import { Injectable, ForbiddenException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(user: UsuarioAtual) {
    return this.prisma.user.findMany({
      where: { instituicaoId: user.instituicaoId },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, email: true, isAdminInstituicao: true, ativo: true, unidadeId: true },
    });
  }

  async criar(user: UsuarioAtual, dto: { nome: string; email: string; senha: string; isAdminInstituicao?: boolean; unidadeId?: string }) {
    if (!user.isAdminInstituicao) {
      throw new ForbiddenException("Apenas o admin da instituição pode cadastrar usuários.");
    }
    const existe = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existe) throw new ConflictException("E-mail já cadastrado.");
    const novo = await this.prisma.user.create({
      data: {
        instituicaoId: user.instituicaoId,
        unidadeId: dto.unidadeId || null,
        nome: dto.nome,
        email: dto.email,
        senhaHash: bcrypt.hashSync(dto.senha, 10),
        isAdminInstituicao: dto.isAdminInstituicao ?? false,
      },
      select: { id: true, nome: true, email: true, isAdminInstituicao: true, ativo: true },
    });
    return novo;
  }
}

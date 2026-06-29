import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import type { Papel } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

/** Papéis que conferem administração da instituição (RN-RBAC). */
const PAPEIS_ADMIN: Papel[] = ["ADMIN_SISTEMA", "GESTAO_INSTITUICAO"];

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(user: UsuarioAtual) {
    return this.prisma.usuario.findMany({
      where: { instituicaoId: user.instituicaoId },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        isAdminInstituicao: true,
        isAtivo: true,
        unidadeId: true,
      },
    });
  }

  async criar(
    user: UsuarioAtual,
    dto: {
      nome: string;
      email: string;
      senha: string;
      papel?: Papel;
      isAdminInstituicao?: boolean;
      unidadeId?: string;
    },
  ) {
    if (!user.isAdminInstituicao) {
      throw new ForbiddenException("Apenas o admin da instituição pode cadastrar usuários.");
    }
    const existe = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existe) throw new ConflictException("E-mail já cadastrado.");
    // papel é a fonte da verdade; isAdminInstituicao é mantido em sincronia (retrocompat).
    const papel: Papel = dto.papel ?? (dto.isAdminInstituicao ? "GESTAO_INSTITUICAO" : "ANALISTA");
    const novo = await this.prisma.usuario.create({
      data: {
        instituicaoId: user.instituicaoId,
        unidadeId: dto.unidadeId || null,
        nome: dto.nome,
        email: dto.email,
        senhaHash: bcrypt.hashSync(dto.senha, 10),
        papel,
        isAdminInstituicao: PAPEIS_ADMIN.includes(papel),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        isAdminInstituicao: true,
        isAtivo: true,
      },
    });
    return novo;
  }

  /** Atribui papel/departamento/unidade a um usuário da instituição (RN-RBAC). */
  async atualizar(
    user: UsuarioAtual,
    id: string,
    dto: {
      papel?: Papel;
      departamentoId?: string | null;
      unidadeId?: string | null;
      isAtivo?: boolean;
    },
  ) {
    if (!user.isAdminInstituicao) {
      throw new ForbiddenException("Apenas o admin da instituição pode editar usuários.");
    }
    const alvo = await this.prisma.usuario.findUnique({
      where: { id },
      select: { instituicaoId: true },
    });
    if (!alvo) throw new NotFoundException("Usuário não encontrado.");
    if (alvo.instituicaoId !== user.instituicaoId && user.papel !== "ADMIN_SISTEMA") {
      throw new ForbiddenException("Usuário de outra instituição.");
    }
    return this.prisma.usuario.update({
      where: { id },
      data: {
        papel: dto.papel,
        departamentoId: dto.departamentoId === undefined ? undefined : dto.departamentoId,
        unidadeId: dto.unidadeId === undefined ? undefined : dto.unidadeId,
        isAtivo: dto.isAtivo,
        // mantém o boolean em sincronia quando o papel muda (retrocompat)
        ...(dto.papel ? { isAdminInstituicao: PAPEIS_ADMIN.includes(dto.papel) } : {}),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        departamentoId: true,
        unidadeId: true,
        isAdminInstituicao: true,
        isAtivo: true,
      },
    });
  }
}

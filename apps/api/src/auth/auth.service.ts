import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Papel } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

export interface JwtPayload {
  sub: string;
  email: string;
  instituicaoId: string;
  papel: Papel;
  isAdminInstituicao: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  static hash(senha: string): string {
    return bcrypt.hashSync(senha, 10);
  }

  async validar(email: string, senha: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isAtivo) return null;
    if (!bcrypt.compareSync(senha, user.senhaHash)) return null;
    return user;
  }

  async login(email: string, senha: string) {
    const user = await this.validar(email, senha);
    if (!user) throw new UnauthorizedException("E-mail ou senha inválidos.");
    return this.emitir(user);
  }

  async registrarInstituicao(dto: {
    instituicaoNome: string;
    adminNome: string;
    adminEmail: string;
    adminSenha: string;
  }) {
    const existe = await this.prisma.user.findUnique({ where: { email: dto.adminEmail } });
    if (existe) throw new ConflictException("E-mail já cadastrado.");

    const inst = await this.prisma.instituicao.create({ data: { nome: dto.instituicaoNome } });
    const admin = await this.prisma.user.create({
      data: {
        instituicaoId: inst.id,
        nome: dto.adminNome,
        email: dto.adminEmail,
        senhaHash: AuthService.hash(dto.adminSenha),
        papel: "GESTAO_INSTITUICAO",
        isAdminInstituicao: true,
      },
    });
    return this.emitir(admin);
  }

  private emitir(user: {
    id: string;
    nome: string;
    email: string;
    instituicaoId: string;
    papel: Papel;
    isAdminInstituicao: boolean;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      instituicaoId: user.instituicaoId,
      papel: user.papel,
      isAdminInstituicao: user.isAdminInstituicao,
    };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        instituicaoId: user.instituicaoId,
        papel: user.papel,
        isAdminInstituicao: user.isAdminInstituicao,
      },
    };
  }
}

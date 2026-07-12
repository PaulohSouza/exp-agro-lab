import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Papel } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { assertSenhaForte } from "./senha";

export interface JwtPayload {
  sub: string;
  email: string;
  instituicaoId: string;
  papel: Papel;
  isAdminInstituicao: boolean;
}

type UsuarioEmitir = {
  id: string;
  nome: string;
  email: string;
  instituicaoId: string;
  papel: Papel;
  isAdminInstituicao: boolean;
};

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
    const user = await this.prisma.usuario.findUnique({ where: { email } });
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
    assertSenhaForte(dto.adminSenha);
    const existe = await this.prisma.usuario.findUnique({ where: { email: dto.adminEmail } });
    if (existe) throw new ConflictException("E-mail já cadastrado.");

    const inst = await this.prisma.instituicao.create({ data: { nome: dto.instituicaoNome } });
    const admin = await this.prisma.usuario.create({
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

  /** Troca um refresh-token válido por um novo par (rotação). Detecta reuso:
   *  se o token apresentado já foi revogado, revoga toda a família do usuário. */
  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const registro = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!registro) throw new UnauthorizedException("Refresh-token inválido.");

    if (registro.revokedAt) {
      // reuso de token já rotacionado → compromete a família inteira.
      await this.prisma.refreshToken.updateMany({
        where: { usuarioId: registro.usuarioId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Refresh-token reutilizado — sessão revogada.");
    }
    if (registro.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Refresh-token expirado.");
    }

    const user = await this.prisma.usuario.findUnique({ where: { id: registro.usuarioId } });
    if (!user || !user.isAtivo) throw new UnauthorizedException("Usuário inativo.");

    const novo = await this.criarRefreshToken(user.id);
    await this.prisma.refreshToken.update({
      where: { id: registro.id },
      data: { revokedAt: new Date(), replacedById: novo.id },
    });
    return this.montar(user, novo.token);
  }

  /** Revoga o refresh-token apresentado (logout). Idempotente. */
  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  private async emitir(user: UsuarioEmitir) {
    const { token } = await this.criarRefreshToken(user.id);
    return this.montar(user, token);
  }

  /** Gera um refresh-token opaco (alta entropia) e persiste só o hash. */
  private async criarRefreshToken(usuarioId: string) {
    const token = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + refreshTtlMs());
    const registro = await this.prisma.refreshToken.create({
      data: { usuarioId, tokenHash: hashToken(token), expiresAt },
    });
    return { token, id: registro.id };
  }

  private montar(user: UsuarioEmitir, refreshToken: string) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      instituicaoId: user.instituicaoId,
      papel: user.papel,
      isAdminInstituicao: user.isAdminInstituicao,
    };
    return {
      access_token: this.jwt.sign(payload),
      refresh_token: refreshToken,
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

/** SHA-256 do token — suficiente para segredos de alta entropia (não é senha). */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Converte JWT_REFRESH_EXPIRES (ex.: "30d", "12h", "45m") em ms. Default 30d. */
function refreshTtlMs(): number {
  const raw = process.env.JWT_REFRESH_EXPIRES ?? "30d";
  const m = /^(\d+)\s*([smhd])$/.exec(raw.trim());
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const mult = { s: 1e3, m: 60e3, h: 3600e3, d: 86400e3 }[m[2]] ?? 86400e3;
  return n * mult;
}

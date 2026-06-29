import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Injectable()
export class CompartilhamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private async carregarExp(id: string) {
    const exp = await this.prisma.experimento.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, titulo: true, ownerId: true, instituicaoId: true },
    });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    return exp;
  }

  /** Só o dono ou um admin da instituição do experimento gerencia compartilhamentos. */
  private podeGerenciar(exp: { ownerId: string; instituicaoId: string }, user: UsuarioAtual) {
    return (
      user.userId === exp.ownerId ||
      (user.isAdminInstituicao && user.instituicaoId === exp.instituicaoId)
    );
  }

  async listar(experimentoId: string, user: UsuarioAtual) {
    const exp = await this.carregarExp(experimentoId);
    if (!this.podeGerenciar(exp, user) && user.instituicaoId !== exp.instituicaoId) {
      throw new ForbiddenException("Sem acesso.");
    }
    return this.prisma.experimentoCompartilhamento.findMany({
      where: { experimentoId },
      include: { user: { select: { id: true, nome: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async compartilhar(
    experimentoId: string,
    user: UsuarioAtual,
    dto: { email: string; nivel: "INPUT" | "EDIT" },
  ) {
    const exp = await this.carregarExp(experimentoId);
    if (!this.podeGerenciar(exp, user))
      throw new ForbiddenException("Apenas o dono ou admin compartilha.");
    const nivel = dto.nivel === "EDIT" ? "EDIT" : "INPUT";

    const alvo = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (alvo) {
      if (alvo.id === exp.ownerId) throw new BadRequestException("Este usuário já é o dono.");
      const existente = await this.prisma.experimentoCompartilhamento.findFirst({
        where: { experimentoId, userId: alvo.id },
      });
      if (existente) {
        return this.prisma.experimentoCompartilhamento.update({
          where: { id: existente.id },
          data: { nivel },
          include: { user: { select: { id: true, nome: true, email: true } } },
        });
      }
      return this.prisma.experimentoCompartilhamento.create({
        data: { experimentoId, userId: alvo.id, nivel, isAceito: true },
        include: { user: { select: { id: true, nome: true, email: true } } },
      });
    }

    // usuário não cadastrado → convite por e-mail (modo simulado)
    const token = randomUUID();
    const share = await this.prisma.experimentoCompartilhamento.create({
      data: { experimentoId, convidadoEmail: dto.email, nivel, token, isAceito: false },
    });
    const base = process.env.EMAIL_BASE_URL ?? "http://localhost:3000";
    await this.email.enviar({
      tipo: "convite_compartilhamento",
      para: dto.email,
      assunto: `[EXP-AGROLAB] Convite para colaborar no experimento ${exp.titulo}`,
      html: `<h2 style="color:#1F2940">Convite de colaboração</h2>
        <p>Você foi convidado a colaborar no experimento <strong>${exp.titulo}</strong> (nível: ${nivel}).</p>
        <p><a href="${base}/convite/${token}" style="background:#6FA830;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Aceitar convite</a></p>`,
      referenciaTipo: "ExperimentoCompartilhamento",
      referenciaId: share.id,
    });
    return share;
  }

  async revogar(shareId: string, user: UsuarioAtual) {
    const share = await this.prisma.experimentoCompartilhamento.findUnique({
      where: { id: shareId },
    });
    if (!share) throw new NotFoundException("Compartilhamento não encontrado.");
    const exp = await this.carregarExp(share.experimentoId);
    if (!this.podeGerenciar(exp, user))
      throw new ForbiddenException("Apenas o dono ou admin revoga.");
    await this.prisma.experimentoCompartilhamento.delete({ where: { id: shareId } });
    return { ok: true };
  }
}

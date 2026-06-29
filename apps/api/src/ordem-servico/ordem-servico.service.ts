import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Injectable()
export class OrdemServicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly experimentos: ExperimentosService,
  ) {}

  async listar(experimentoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(experimentoId, user);
    return this.prisma.ordemServico.findMany({
      where: { experimentoId },
      orderBy: { createdAt: "desc" },
      include: { aprovacoesInternas: true, aprovacaoCliente: true },
    });
  }

  async criar(experimentoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(experimentoId, user, "EDIT");
    return this.prisma.ordemServico.create({ data: { experimentoId, status: "RASCUNHO" } });
  }

  private async carregarOS(id: string) {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: {
        experimento: { select: { id: true, titulo: true, instituicaoId: true } },
        aprovacaoCliente: true,
        aprovacoesInternas: true,
      },
    });
    if (!os) throw new NotFoundException("Ordem de serviço não encontrada.");
    return os;
  }

  /** Submete a OS: cria a aprovação do cliente (token) e roteia para aprovação interna ou cliente. */
  async submeter(id: string, user: UsuarioAtual, dto: { clienteEmail: string }) {
    const os = await this.carregarOS(id);
    await this.experimentos.garantirAcesso(os.experimento.id, user, "EDIT");
    if (os.status !== "RASCUNHO" && os.status !== "RECUSADA") {
      throw new BadRequestException("OS já submetida.");
    }
    if (!dto.clienteEmail) throw new BadRequestException("Informe o e-mail do cliente.");

    if (!os.aprovacaoCliente) {
      await this.prisma.aprovacaoCliente.create({
        data: {
          ordemServicoId: id,
          clienteEmail: dto.clienteEmail,
          token: randomUUID(),
          decisao: "PENDENTE",
        },
      });
    } else {
      await this.prisma.aprovacaoCliente.update({
        where: { ordemServicoId: id },
        data: {
          clienteEmail: dto.clienteEmail,
          decisao: "PENDENTE",
          motivo: null,
          decididoAt: null,
        },
      });
    }
    // limpa decisões internas anteriores numa re-submissão
    await this.prisma.aprovacaoOSInterna.deleteMany({ where: { ordemServicoId: id } });

    const aprovadores = await this.prisma.aprovadorInstituicao.count({
      where: { instituicaoId: os.experimento.instituicaoId, isAtivo: true },
    });

    if (aprovadores > 0) {
      await this.prisma.ordemServico.update({
        where: { id },
        data: { status: "AGUARDANDO_APROVACAO_INTERNA" },
      });
    } else {
      await this.prisma.ordemServico.update({
        where: { id },
        data: { status: "AGUARDANDO_APROVACAO_CLIENTE" },
      });
      await this.enviarEmailCliente(id);
    }
    return this.carregarOS(id);
  }

  async aprovarInterno(
    id: string,
    user: UsuarioAtual,
    dto: { decisao: "APROVADO" | "RECUSADO"; motivo?: string },
  ) {
    const os = await this.carregarOS(id);
    if (os.status !== "AGUARDANDO_APROVACAO_INTERNA") {
      throw new BadRequestException("OS não está em aprovação interna.");
    }
    const aprovador = await this.prisma.aprovadorInstituicao.findFirst({
      where: { instituicaoId: os.experimento.instituicaoId, userId: user.userId, isAtivo: true },
    });
    if (!aprovador) throw new ForbiddenException("Você não é aprovador desta instituição.");

    const existente = os.aprovacoesInternas.find((a) => a.aprovadorUserId === user.userId);
    if (existente) {
      await this.prisma.aprovacaoOSInterna.update({
        where: { id: existente.id },
        data: { decisao: dto.decisao, motivo: dto.motivo },
      });
    } else {
      await this.prisma.aprovacaoOSInterna.create({
        data: {
          ordemServicoId: id,
          aprovadorUserId: user.userId,
          decisao: dto.decisao,
          motivo: dto.motivo,
        },
      });
    }

    if (dto.decisao === "RECUSADO") {
      await this.prisma.ordemServico.update({ where: { id }, data: { status: "RECUSADA" } });
      return this.carregarOS(id);
    }

    // avalia política
    const inst = await this.prisma.instituicao.findUnique({
      where: { id: os.experimento.instituicaoId },
    });
    const ativos = await this.prisma.aprovadorInstituicao.findMany({
      where: { instituicaoId: os.experimento.instituicaoId, isAtivo: true },
      select: { userId: true },
    });
    const ativosIds = new Set(ativos.map((a) => a.userId));
    const aprovacoes = await this.prisma.aprovacaoOSInterna.findMany({
      where: { ordemServicoId: id, decisao: "APROVADO" },
    });
    const aprovados = new Set(
      aprovacoes.map((a) => a.aprovadorUserId).filter((u) => ativosIds.has(u)),
    );

    const satisfeito =
      inst?.politicaAprovacao === "N_DE_M"
        ? aprovados.size >= (inst?.numeroAprovadores ?? 1)
        : ativosIds.size > 0 && aprovados.size >= ativosIds.size;

    if (satisfeito) {
      await this.prisma.ordemServico.update({
        where: { id },
        data: { status: "AGUARDANDO_APROVACAO_CLIENTE" },
      });
      await this.enviarEmailCliente(id);
    }
    return this.carregarOS(id);
  }

  /** Endpoint público: cliente decide via token do e-mail. */
  async decisaoCliente(
    token: string,
    dto: { decisao: "APROVADO" | "RECUSADO"; motivo?: string; ip?: string },
  ) {
    const ap = await this.prisma.aprovacaoCliente.findUnique({
      where: { token },
      include: { ordemServico: { include: { experimento: { select: { titulo: true } } } } },
    });
    if (!ap) throw new NotFoundException("Convite de aprovação inválido.");
    if (ap.ordemServico.status !== "AGUARDANDO_APROVACAO_CLIENTE") {
      throw new BadRequestException("Esta OS não está aguardando aprovação do cliente.");
    }
    await this.prisma.aprovacaoCliente.update({
      where: { token },
      data: { decisao: dto.decisao, motivo: dto.motivo, decididoAt: new Date(), ip: dto.ip },
    });
    await this.prisma.ordemServico.update({
      where: { id: ap.ordemServicoId },
      data: { status: dto.decisao === "APROVADO" ? "APROVADA" : "RECUSADA" },
    });
    return {
      ok: true,
      experimento: ap.ordemServico.experimento.titulo,
      decisao: dto.decisao,
    };
  }

  private async enviarEmailCliente(osId: string) {
    const os = await this.carregarOS(osId);
    if (!os.aprovacaoCliente) return;
    await this.email.enviarAprovacaoCliente({
      para: os.aprovacaoCliente.clienteEmail,
      ordemServicoId: osId,
      token: os.aprovacaoCliente.token,
      experimentoTitulo: os.experimento.titulo,
    });
  }
}

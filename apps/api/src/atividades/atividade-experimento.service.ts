import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { validarApontamento, type ValorApontamento } from "@exp/domain";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

interface CriarAtividadeDto {
  modeloId?: string; // do catálogo (herda nome/tipo/campos) — ou ad-hoc
  nome?: string;
  tipo?: "acao" | "apontamento";
  data?: string;
  responsavel?: string;
  obs?: string;
}

@Injectable()
export class AtividadeExperimentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly experimentos: ExperimentosService,
  ) {}

  async listar(experimentoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(experimentoId, user);
    return this.prisma.atividadeExperimento.findMany({
      where: { experimentoId },
      orderBy: { ordem: "asc" },
      include: { valores: true, modelo: { include: { campos: { orderBy: { ordem: "asc" } } } } },
    });
  }

  /** Cria uma atividade no experimento. Se vier `modeloId`, herda nome/tipo e
   *  pré-cria os valores (vazios) a partir dos campos do modelo. */
  async criar(experimentoId: string, user: UsuarioAtual, dto: CriarAtividadeDto) {
    await this.experimentos.garantirAcesso(experimentoId, user, "edit");

    let nome = dto.nome;
    let tipo = dto.tipo ?? "acao";
    let camposSnapshot: { rotulo: string }[] = [];

    if (dto.modeloId) {
      const modelo = await this.prisma.modeloAtividade.findUnique({
        where: { id: dto.modeloId },
        include: { campos: { orderBy: { ordem: "asc" } } },
      });
      if (!modelo) throw new NotFoundException("Modelo de atividade não encontrado.");
      nome = nome ?? modelo.nome;
      tipo = modelo.tipo;
      camposSnapshot = modelo.campos.map((c) => ({ rotulo: c.rotulo }));
    }
    if (!nome) throw new BadRequestException("Informe o nome ou um modelo.");

    const ordem = (await this.prisma.atividadeExperimento.count({ where: { experimentoId } })) + 1;
    return this.prisma.atividadeExperimento.create({
      data: {
        experimentoId,
        modeloId: dto.modeloId,
        nome,
        tipo,
        data: dto.data ? new Date(dto.data) : null,
        responsavel: dto.responsavel,
        obs: dto.obs,
        ordem,
        valores: camposSnapshot.length ? { create: camposSnapshot } : undefined,
      },
      include: { valores: true, modelo: { include: { campos: { orderBy: { ordem: "asc" } } } } },
    });
  }

  /** Registra/atualiza os valores do apontamento, validando contra os campos do modelo. */
  async registrarApontamento(atividadeId: string, user: UsuarioAtual, valores: ValorApontamento[]) {
    const atv = await this.prisma.atividadeExperimento.findUnique({
      where: { id: atividadeId },
      include: { modelo: { include: { campos: true } } },
    });
    if (!atv) throw new NotFoundException("Atividade não encontrada.");
    await this.experimentos.garantirAcesso(atv.experimentoId, user, "edit");

    const campos = (atv.modelo?.campos ?? []).map((c) => ({ rotulo: c.rotulo, tipo: c.tipo, obrigatorio: c.obrigatorio }));
    if (campos.length) {
      const erros = validarApontamento(campos, valores);
      if (erros.length) throw new BadRequestException(erros.join("; "));
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.atividadeApontamentoValor.deleteMany({ where: { atividadeId } });
      if (valores.length) {
        await tx.atividadeApontamentoValor.createMany({
          data: valores.map((v) => ({
            atividadeId,
            rotulo: v.rotulo,
            valorNum: v.valorNum ?? null,
            valorTexto: v.valorTexto ?? null,
            valorData: v.valorData ? new Date(v.valorData) : null,
            valorBool: v.valorBool ?? null,
          })),
        });
      }
    });
    return this.prisma.atividadeExperimento.findUnique({ where: { id: atividadeId }, include: { valores: true } });
  }

  async remover(atividadeId: string, user: UsuarioAtual) {
    const atv = await this.prisma.atividadeExperimento.findUnique({ where: { id: atividadeId }, select: { experimentoId: true } });
    if (!atv) throw new NotFoundException("Atividade não encontrada.");
    await this.experimentos.garantirAcesso(atv.experimentoId, user, "edit");
    await this.prisma.atividadeExperimento.delete({ where: { id: atividadeId } });
    return { ok: true };
  }
}

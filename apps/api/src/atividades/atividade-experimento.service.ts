import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  validarApontamento,
  marcosPadrao,
  type ValorApontamento,
  type MarcoTipo,
} from "@exp/domain";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const ROTULO_MARCO: Record<MarcoTipo, string> = {
  IMPLANTACAO: "Implantação (previsão)",
  INICIO: "Início do ensaio",
  SEMEADURA: "Semeadura",
  COLHEITA: "Colheita",
  FIM: "Encerramento",
};

interface CriarAtividadeDto {
  modeloId?: string; // do catálogo (herda nome/tipo/campos) — ou ad-hoc
  nome?: string;
  tipo?: "ACAO" | "APONTAMENTO";
  data?: string;
  responsavel?: string;
  observacoes?: string;
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
    await this.experimentos.garantirAcesso(experimentoId, user, "EDIT");

    let nome = dto.nome;
    let tipo = dto.tipo ?? "ACAO";
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
        observacoes: dto.observacoes,
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
    await this.experimentos.garantirAcesso(atv.experimentoId, user, "EDIT");

    const campos = (atv.modelo?.campos ?? []).map((c) => ({
      rotulo: c.rotulo,
      tipo: c.tipo,
      isObrigatorio: c.isObrigatorio,
    }));
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
    return this.prisma.atividadeExperimento.findUnique({
      where: { id: atividadeId },
      include: { valores: true },
    });
  }

  /** Cria os marcos do cronograma faltantes (implantação/início/fim + semeadura/colheita se cultura). */
  async gerarMarcos(experimentoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(experimentoId, user, "EDIT");
    const exp = await this.prisma.experimento.findUnique({
      where: { id: experimentoId },
      select: {
        objetoEstudo: {
          select: { subcategoria: { select: { categoria: { select: { isCultura: true } } } } },
        },
      },
    });
    const isCultura = exp?.objetoEstudo?.subcategoria?.categoria?.isCultura ?? false;
    const desejados = marcosPadrao(isCultura);

    const existentes = new Set(
      (
        await this.prisma.atividadeExperimento.findMany({
          where: { experimentoId, marco: { not: null } },
          select: { marco: true },
        })
      ).map((a) => a.marco as MarcoTipo),
    );
    const faltantes = desejados.filter((m) => !existentes.has(m));
    let ordem = await this.prisma.atividadeExperimento.count({ where: { experimentoId } });
    // Modelo de Colheita (apontamento linhas/comprimento) que fornece a área útil (RN-PROD / C5).
    const modeloColheita = faltantes.includes("COLHEITA")
      ? await this.prisma.modeloAtividade.findFirst({
          where: { isFonteAreaColheita: true, isAtivo: true },
          include: { campos: { orderBy: { ordem: "asc" } } },
        })
      : null;
    for (const m of faltantes) {
      ordem += 1;
      if (m === "COLHEITA" && modeloColheita) {
        await this.prisma.atividadeExperimento.create({
          data: {
            experimentoId,
            marco: m,
            nome: ROTULO_MARCO[m],
            modeloId: modeloColheita.id,
            tipo: modeloColheita.tipo,
            ordem,
            valores: modeloColheita.campos.length
              ? { create: modeloColheita.campos.map((c) => ({ rotulo: c.rotulo })) }
              : undefined,
          },
        });
      } else {
        await this.prisma.atividadeExperimento.create({
          data: { experimentoId, nome: ROTULO_MARCO[m], marco: m, tipo: "ACAO", ordem },
        });
      }
    }
    return { criados: faltantes.map((m) => ROTULO_MARCO[m]), isCultura };
  }

  /** Atualiza um marco/atividade: previsão, confirmação e data realizada. */
  async atualizar(
    atividadeId: string,
    user: UsuarioAtual,
    dto: {
      dataPrevista?: string | null;
      isConfirmada?: boolean;
      data?: string | null;
      responsavel?: string;
      observacoes?: string;
    },
  ) {
    const atv = await this.prisma.atividadeExperimento.findUnique({
      where: { id: atividadeId },
      select: { experimentoId: true },
    });
    if (!atv) throw new NotFoundException("Atividade não encontrada.");
    await this.experimentos.garantirAcesso(atv.experimentoId, user, "EDIT");
    return this.prisma.atividadeExperimento.update({
      where: { id: atividadeId },
      data: {
        dataPrevista:
          dto.dataPrevista === undefined
            ? undefined
            : dto.dataPrevista
              ? new Date(dto.dataPrevista)
              : null,
        isConfirmada: dto.isConfirmada,
        data: dto.data === undefined ? undefined : dto.data ? new Date(dto.data) : null,
        responsavel: dto.responsavel,
        observacoes: dto.observacoes,
      },
      include: { valores: true, modelo: { include: { campos: { orderBy: { ordem: "asc" } } } } },
    });
  }

  async remover(atividadeId: string, user: UsuarioAtual) {
    const atv = await this.prisma.atividadeExperimento.findUnique({
      where: { id: atividadeId },
      select: { experimentoId: true },
    });
    if (!atv) throw new NotFoundException("Atividade não encontrada.");
    await this.experimentos.garantirAcesso(atv.experimentoId, user, "EDIT");
    await this.prisma.atividadeExperimento.delete({ where: { id: atividadeId } });
    return { ok: true };
  }
}

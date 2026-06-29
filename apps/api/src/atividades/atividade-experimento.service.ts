import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { validarApontamento, marcosPadrao, type ValorApontamento, type MarcoTipo } from "@exp/domain";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const ROTULO_MARCO: Record<MarcoTipo, string> = {
  implantacao: "Implantação (previsão)",
  inicio: "Início do ensaio",
  semeadura: "Semeadura",
  colheita: "Colheita",
  fim: "Encerramento",
};

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

  /** Cria os marcos do cronograma faltantes (implantação/início/fim + semeadura/colheita se cultura). */
  async gerarMarcos(experimentoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(experimentoId, user, "edit");
    const exp = await this.prisma.experimento.findUnique({
      where: { id: experimentoId },
      select: { objetoEstudo: { select: { subcategoria: { select: { categoria: { select: { eCultura: true } } } } } } },
    });
    const eCultura = exp?.objetoEstudo?.subcategoria?.categoria?.eCultura ?? false;
    const desejados = marcosPadrao(eCultura);

    const existentes = new Set(
      (await this.prisma.atividadeExperimento.findMany({
        where: { experimentoId, marco: { not: null } },
        select: { marco: true },
      })).map((a) => a.marco as MarcoTipo),
    );
    const faltantes = desejados.filter((m) => !existentes.has(m));
    let ordem = await this.prisma.atividadeExperimento.count({ where: { experimentoId } });
    // Modelo de Colheita (apontamento linhas/comprimento) que fornece a área útil (RN-PROD / C5).
    const modeloColheita = faltantes.includes("colheita")
      ? await this.prisma.modeloAtividade.findFirst({ where: { fornecAreaColheita: true, ativo: true }, include: { campos: { orderBy: { ordem: "asc" } } } })
      : null;
    for (const m of faltantes) {
      ordem += 1;
      if (m === "colheita" && modeloColheita) {
        await this.prisma.atividadeExperimento.create({
          data: {
            experimentoId, marco: m, nome: ROTULO_MARCO[m], modeloId: modeloColheita.id, tipo: modeloColheita.tipo, ordem,
            valores: modeloColheita.campos.length ? { create: modeloColheita.campos.map((c) => ({ rotulo: c.rotulo })) } : undefined,
          },
        });
      } else {
        await this.prisma.atividadeExperimento.create({ data: { experimentoId, nome: ROTULO_MARCO[m], marco: m, tipo: "acao", ordem } });
      }
    }
    return { criados: faltantes.map((m) => ROTULO_MARCO[m]), eCultura };
  }

  /** Atualiza um marco/atividade: previsão, confirmação e data realizada. */
  async atualizar(atividadeId: string, user: UsuarioAtual, dto: { dataPrevista?: string | null; confirmada?: boolean; data?: string | null; responsavel?: string; obs?: string }) {
    const atv = await this.prisma.atividadeExperimento.findUnique({ where: { id: atividadeId }, select: { experimentoId: true } });
    if (!atv) throw new NotFoundException("Atividade não encontrada.");
    await this.experimentos.garantirAcesso(atv.experimentoId, user, "edit");
    return this.prisma.atividadeExperimento.update({
      where: { id: atividadeId },
      data: {
        dataPrevista: dto.dataPrevista === undefined ? undefined : dto.dataPrevista ? new Date(dto.dataPrevista) : null,
        confirmada: dto.confirmada,
        data: dto.data === undefined ? undefined : dto.data ? new Date(dto.data) : null,
        responsavel: dto.responsavel,
        obs: dto.obs,
      },
      include: { valores: true, modelo: { include: { campos: { orderBy: { ordem: "asc" } } } } },
    });
  }

  async remover(atividadeId: string, user: UsuarioAtual) {
    const atv = await this.prisma.atividadeExperimento.findUnique({ where: { id: atividadeId }, select: { experimentoId: true } });
    if (!atv) throw new NotFoundException("Atividade não encontrada.");
    await this.experimentos.garantirAcesso(atv.experimentoId, user, "edit");
    await this.prisma.atividadeExperimento.delete({ where: { id: atividadeId } });
    return { ok: true };
  }
}

import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import {
  calcularSaida,
  resolverPrerequisitos,
  calcularAreaUtilColhida,
  dedupLancamentos,
  type LancamentoLote,
} from "@exp/domain";
import { anovaUmFator, type Observacao, type Delineamento } from "@exp/analytics";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

export interface CriarAvaliacaoDto {
  nome: string;
  metodologia?: string;
  unidadeColeta?: string;
  unidadeSaida?: string;
  formula?: string;
  tipo?: "calendarizada" | "condicional";
  isPersonalizada?: boolean;
  escala?: string;
  timingId?: string;
  dataPrevista?: string;
  ordem?: number;
}

export interface LancarDadoDto {
  parcelaId: string;
  numAmostra?: number;
  valorColetado?: number;
  obs?: string;
  origem?: "web" | "mobile";
}

@Injectable()
export class AvaliacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly experimentos: ExperimentosService,
  ) {}

  /** Resolve o experimento de uma avaliação (para checagem de acesso). */
  private async expIdDaAvaliacao(avaliacaoId: string): Promise<string> {
    const a = await this.prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      select: { experimentoId: true },
    });
    if (!a) throw new NotFoundException("Avaliação não encontrada.");
    return a.experimentoId;
  }

  /**
   * Área útil (m²) do ensaio para o cálculo de produtividade (RN-PROD / C5):
   * vem da ATIVIDADE de Colheita (modelo `isFonteAreaColheita`), com os campos
   * `linhas` e `comprimento` × o espaçamento do experimento. Única para todas as
   * parcelas. Retorna undefined se a colheita ainda não foi registrada.
   */
  private async areaUtilDoExperimento(experimentoId: string): Promise<number | undefined> {
    const exp = await this.prisma.experimento.findUnique({
      where: { id: experimentoId },
      select: { espacamentoLinhasM: true },
    });
    const espac = exp?.espacamentoLinhasM ?? undefined;
    if (!espac) return undefined;
    const colheita = await this.prisma.atividadeExperimento.findFirst({
      where: { experimentoId, modelo: { isFonteAreaColheita: true } },
      include: { valores: true },
    });
    if (!colheita) return undefined;
    const linhas = colheita.valores.find((v) => v.rotulo === "linhas")?.valorNum ?? undefined;
    const comprimento =
      colheita.valores.find((v) => v.rotulo === "comprimento")?.valorNum ?? undefined;
    if (!linhas || !comprimento) return undefined;
    try {
      return calcularAreaUtilColhida({
        numLinhasColhidas: linhas,
        espacamentoLinhasM: espac,
        comprimentoColhidoM: comprimento,
      });
    } catch {
      return undefined;
    }
  }

  async listar(experimentoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(experimentoId, user);
    return this.prisma.avaliacao.findMany({
      where: { experimentoId },
      orderBy: { ordem: "asc" },
      include: { timing: true, _count: { select: { dados: true } } },
    });
  }

  /**
   * Adiciona avaliações a partir do catálogo (A5). Resolve o fechamento
   * transitivo dos pré-requisitos (regra do domínio) — ex.: Produtividade traz
   * Umidade — e cria uma avaliação por modelo, herdando os campos. Modelos já
   * presentes no experimento são ignorados (não duplica).
   */
  async adicionarDoModelo(experimentoId: string, user: UsuarioAtual, modeloIds: string[]) {
    await this.experimentos.garantirAcesso(experimentoId, user, "edit");
    if (!modeloIds?.length) throw new BadRequestException("Informe ao menos um modelo.");

    const arestas = await this.prisma.modeloAvaliacaoPrereq.findMany({
      select: { modeloId: true, prerequisitoId: true },
    });
    const { todos, adicionados } = resolverPrerequisitos(modeloIds, arestas);

    const modelos = await this.prisma.modeloAvaliacao.findMany({ where: { id: { in: todos } } });
    if (modelos.length !== todos.length) throw new BadRequestException("Modelo inexistente.");

    const jaPresentes = new Set(
      (
        await this.prisma.avaliacao.findMany({
          where: { experimentoId, modeloId: { in: todos } },
          select: { modeloId: true },
        })
      ).map((a) => a.modeloId),
    );

    let ordem = await this.prisma.avaliacao.count({ where: { experimentoId } });
    const porId = new Map(modelos.map((m) => [m.id, m]));
    const criadas = [];
    for (const id of todos) {
      if (jaPresentes.has(id)) continue;
      const m = porId.get(id)!;
      ordem += 1;
      criadas.push(
        await this.prisma.avaliacao.create({
          data: {
            experimentoId,
            modeloId: m.id,
            nome: m.nome,
            descricaoColeta: m.descricaoColeta,
            numeroPontos: m.numeroPontos,
            metodologia: m.metodologiaRelatorio,
            unidadeColeta: m.unidadeColeta,
            unidadeSaida: m.unidadeSaida,
            formula: m.calculoRelatorio,
            ordem,
          },
          include: { timing: true, _count: { select: { dados: true } } },
        }),
      );
    }

    // pré-requisitos de ATIVIDADE de todas as avaliações resolvidas: cria as faltantes
    const atividadesAdicionadas = await this.adicionarAtividadesPrereq(experimentoId, todos);

    return {
      criadas,
      // avaliações auto-incluídas por serem pré-requisito (para o aviso na UI)
      prerequisitosAdicionados: adicionados
        .filter((id) => !jaPresentes.has(id))
        .map((id) => porId.get(id)?.nome ?? id),
      // atividades auto-incluídas por serem pré-requisito
      atividadesAdicionadas,
    };
  }

  /** Cria, no experimento, as atividades exigidas (pré-requisito) pelas avaliações
   *  resolvidas que ainda não existam. Retorna os nomes adicionados. */
  private async adicionarAtividadesPrereq(
    experimentoId: string,
    modeloAvaliacaoIds: string[],
  ): Promise<string[]> {
    const arestas = await this.prisma.modeloAvaliacaoPrereqAtividade.findMany({
      where: { modeloAvaliacaoId: { in: modeloAvaliacaoIds } },
      select: { modeloAtividadeId: true },
    });
    const ids = [...new Set(arestas.map((a) => a.modeloAtividadeId))];
    if (!ids.length) return [];

    const jaPresentes = new Set(
      (
        await this.prisma.atividadeExperimento.findMany({
          where: { experimentoId, modeloId: { in: ids } },
          select: { modeloId: true },
        })
      ).map((a) => a.modeloId),
    );
    const faltantes = ids.filter((id) => !jaPresentes.has(id));
    if (!faltantes.length) return [];

    const modelos = await this.prisma.modeloAtividade.findMany({
      where: { id: { in: faltantes } },
      include: { campos: { orderBy: { ordem: "asc" } } },
    });
    let ordem = await this.prisma.atividadeExperimento.count({ where: { experimentoId } });
    const nomes: string[] = [];
    for (const m of modelos) {
      ordem += 1;
      await this.prisma.atividadeExperimento.create({
        data: {
          experimentoId,
          modeloId: m.id,
          nome: m.nome,
          tipo: m.tipo,
          ordem,
          valores: m.campos.length
            ? { create: m.campos.map((c) => ({ rotulo: c.rotulo })) }
            : undefined,
        },
      });
      nomes.push(m.nome);
    }
    return nomes;
  }

  async criar(experimentoId: string, user: UsuarioAtual, dto: CriarAvaliacaoDto) {
    await this.experimentos.garantirAcesso(experimentoId, user, "edit");
    const ordem =
      dto.ordem ?? (await this.prisma.avaliacao.count({ where: { experimentoId } })) + 1;
    return this.prisma.avaliacao.create({
      data: {
        experimentoId,
        nome: dto.nome,
        metodologia: dto.metodologia,
        unidadeColeta: dto.unidadeColeta,
        unidadeSaida: dto.unidadeSaida,
        formula: dto.formula,
        tipo: dto.tipo ?? "calendarizada",
        isPersonalizada: dto.isPersonalizada ?? false,
        escala: dto.escala,
        timingId: dto.timingId || null,
        dataPrevista: dto.dataPrevista ? new Date(dto.dataPrevista) : null,
        ordem,
      },
      include: { timing: true },
    });
  }

  async atualizar(id: string, user: UsuarioAtual, dto: Partial<CriarAvaliacaoDto>) {
    await this.experimentos.garantirAcesso(await this.expIdDaAvaliacao(id), user, "edit");
    return this.prisma.avaliacao.update({
      where: { id },
      data: {
        nome: dto.nome,
        metodologia: dto.metodologia,
        unidadeColeta: dto.unidadeColeta,
        unidadeSaida: dto.unidadeSaida,
        formula: dto.formula,
        tipo: dto.tipo,
        isPersonalizada: dto.isPersonalizada,
        escala: dto.escala,
        timingId: dto.timingId === undefined ? undefined : dto.timingId || null,
        dataPrevista: dto.dataPrevista ? new Date(dto.dataPrevista) : undefined,
      },
      include: { timing: true },
    });
  }

  async remover(id: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(await this.expIdDaAvaliacao(id), user, "edit");
    await this.prisma.avaliacaoDado.deleteMany({ where: { avaliacaoId: id } });
    await this.prisma.avaliacao.delete({ where: { id } });
    return { ok: true };
  }

  async listarDados(avaliacaoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(await this.expIdDaAvaliacao(avaliacaoId), user);
    return this.prisma.avaliacaoDado.findMany({
      where: { avaliacaoId, deletedAt: null },
      include: { parcela: { include: { tratamento: true } } },
      orderBy: { parcela: { numero: "asc" } },
    });
  }

  /** Aplica um grupo de coleta: adiciona as avaliações dos modelos do grupo
   *  (com pré-requisitos) e as marca com o grupo, p/ filtrar a coleta por grupo. */
  async aplicarGrupo(experimentoId: string, user: UsuarioAtual, grupoId: string) {
    const grupo = await this.prisma.grupoColeta.findUnique({
      where: { id: grupoId },
      include: { itens: true },
    });
    if (!grupo) throw new NotFoundException("Grupo de coleta não encontrado.");
    const modeloIds = grupo.itens.map((i) => i.modeloId);
    if (!modeloIds.length) throw new BadRequestException("Grupo sem avaliações.");
    const r = await this.adicionarDoModelo(experimentoId, user, modeloIds);
    const ids = r.criadas.map((a) => a.id);
    if (ids.length)
      await this.prisma.avaliacao.updateMany({
        where: { id: { in: ids } },
        data: { grupoColetaId: grupoId },
      });
    return r;
  }

  /**
   * COLETA EM LOTE (Macro B): grava várias avaliações × parcelas numa transação.
   * Otimiza a coleta quando se registra um conjunto de avaliações junto (ex.:
   * Umidade + PMG + Produtividade). Idempotente (upsert por chave única).
   */
  async lancarLote(experimentoId: string, user: UsuarioAtual, lancamentos: LancamentoLote[]) {
    await this.experimentos.garantirAcesso(experimentoId, user);
    if (!lancamentos?.length) return { salvos: 0 };
    const avalIds = [...new Set(lancamentos.map((l) => l.avaliacaoId))];
    const validas = await this.prisma.avaliacao.count({
      where: { id: { in: avalIds }, experimentoId },
    });
    if (validas !== avalIds.length) throw new BadRequestException("Avaliação fora do experimento.");

    const limpos = dedupLancamentos(lancamentos);
    await this.prisma.$transaction(
      limpos.map((l) => {
        const numAmostra = l.numAmostra ?? 1;
        return this.prisma.avaliacaoDado.upsert({
          where: {
            avaliacaoId_parcelaId_numAmostra: {
              avaliacaoId: l.avaliacaoId,
              parcelaId: l.parcelaId,
              numAmostra,
            },
          },
          create: {
            avaliacaoId: l.avaliacaoId,
            parcelaId: l.parcelaId,
            numAmostra,
            valorColetado: l.valorColetado ?? null,
            origem: "web",
            syncedAt: new Date(),
          },
          update: { valorColetado: l.valorColetado ?? null, syncedAt: new Date() },
        });
      }),
    );
    return { salvos: limpos.length };
  }

  /** Lança/atualiza o VALOR BRUTO por parcela (acesso >= input). */
  async lancar(avaliacaoId: string, user: UsuarioAtual, dados: LancarDadoDto[]) {
    await this.experimentos.garantirAcesso(await this.expIdDaAvaliacao(avaliacaoId), user);
    for (const d of dados) {
      const numAmostra = d.numAmostra ?? 1;
      await this.prisma.avaliacaoDado.upsert({
        where: {
          avaliacaoId_parcelaId_numAmostra: { avaliacaoId, parcelaId: d.parcelaId, numAmostra },
        },
        create: {
          avaliacaoId,
          parcelaId: d.parcelaId,
          numAmostra,
          valorColetado: d.valorColetado,
          obs: d.obs,
          origem: d.origem ?? "web",
          syncedAt: new Date(),
        },
        update: {
          valorColetado: d.valorColetado,
          obs: d.obs,
          syncedAt: new Date(),
        },
      });
    }
    return this.listarDados(avaliacaoId, user);
  }

  /**
   * ANÁLISE estatística (ANOVA 1 fator) sobre os valores de saída coletados.
   * Usa o delineamento do experimento (DIC/DBC). Port do SAGRE — fase A.
   */
  async analise(avaliacaoId: string, user: UsuarioAtual, metodo?: "LSD" | "Tukey" | "ScottKnott") {
    await this.experimentos.garantirAcesso(await this.expIdDaAvaliacao(avaliacaoId), user);
    const aval = await this.prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: { experimento: { include: { delineamento: true } } },
    });
    if (!aval) throw new NotFoundException("Avaliação não encontrada.");
    const dados = await this.prisma.avaliacaoDado.findMany({
      where: { avaliacaoId, deletedAt: null, valorColetado: { not: null } },
      include: { parcela: { include: { tratamento: true } } },
    });

    const areaUtil = await this.areaUtilDoExperimento(aval.experimentoId);
    const obs: Observacao[] = dados.map((d) => {
      let valor = d.valorColetado as number;
      if (aval.formula) {
        try {
          valor = calcularSaida({
            valorColetado: d.valorColetado as number,
            formula: aval.formula,
            params: areaUtil ? { areaUtil } : {},
          });
        } catch {
          /* mantém bruto */
        }
      }
      return { tratamento: d.parcela.tratamento?.tag ?? "?", bloco: d.parcela.bloco, valor };
    });

    const nome = (aval.experimento.delineamento?.nome ?? "").toUpperCase();
    const delineamento: Delineamento =
      nome.includes("DBC") || nome.includes("BLOCO") ? "DBC" : "DIC";

    try {
      const resultado = anovaUmFator(obs, delineamento, { metodo: metodo ?? "Tukey" });
      return {
        avaliacao: { nome: aval.nome, unidadeSaida: aval.unidadeSaida },
        delineamento,
        n: obs.length,
        resultado,
      };
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : "Não foi possível analisar.");
    }
  }

  /** RELATÓRIO: conversão para a unidade de saída acontece AQUI (não na coleta). */
  async relatorio(avaliacaoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(await this.expIdDaAvaliacao(avaliacaoId), user);
    const aval = await this.prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: { experimento: true },
    });
    if (!aval) throw new NotFoundException("Avaliação não encontrada.");
    const dados = await this.prisma.avaliacaoDado.findMany({
      where: { avaliacaoId, deletedAt: null },
      include: { parcela: { include: { tratamento: true } } },
      orderBy: { parcela: { numero: "asc" } },
    });
    const areaUtil = await this.areaUtilDoExperimento(aval.experimentoId);

    const linhas = dados.map((d) => {
      let valorSaida: number | null = null;
      if (aval.formula && d.valorColetado != null) {
        try {
          valorSaida = calcularSaida({
            valorColetado: d.valorColetado,
            formula: aval.formula,
            params: areaUtil ? { areaUtil } : {},
          });
        } catch {
          valorSaida = null;
        }
      }
      return {
        parcela: d.parcela.numero,
        bloco: d.parcela.bloco,
        tratamento: d.parcela.tratamento?.tag ?? "",
        tratamentoNome: d.parcela.tratamento?.nome ?? "",
        valorColetado: d.valorColetado,
        areaUtilM2: areaUtil ?? null,
        valorSaida,
      };
    });

    const porTrat = new Map<string, { soma: number; n: number; nome: string }>();
    for (const l of linhas) {
      if (l.valorSaida == null) continue;
      const cur = porTrat.get(l.tratamento) ?? { soma: 0, n: 0, nome: l.tratamentoNome };
      cur.soma += l.valorSaida;
      cur.n += 1;
      porTrat.set(l.tratamento, cur);
    }
    const medias = [...porTrat.entries()]
      .map(([tag, v]) => ({ tratamento: tag, nome: v.nome, media: v.soma / v.n }))
      .sort((a, b) => a.tratamento.localeCompare(b.tratamento));

    return {
      avaliacao: {
        nome: aval.nome,
        unidadeColeta: aval.unidadeColeta,
        unidadeSaida: aval.unidadeSaida,
        formula: aval.formula,
      },
      linhas,
      medias,
    };
  }
}

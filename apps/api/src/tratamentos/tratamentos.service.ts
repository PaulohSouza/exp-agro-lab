import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

export interface ProdutoLinhaDto {
  produtoId: string;
  seq?: number;
  modoAplicacao?: string;
  dose?: number;
  unidadeDose?: string;
  volumeCaldaLha?: number;
  referencia?: string;
  timingId?: string;
  atividadeId?: string;
  descricao?: string;
}

@Injectable()
export class TratamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly experimentos: ExperimentosService,
  ) {}

  private async expIdDoTratamento(tratamentoId: string): Promise<string> {
    const t = await this.prisma.tratamento.findUnique({
      where: { id: tratamentoId },
      select: { experimentoId: true },
    });
    if (!t) throw new NotFoundException("Tratamento não encontrado.");
    return t.experimentoId;
  }
  private async expIdDoProduto(produtoLinhaId: string): Promise<string> {
    const tp = await this.prisma.tratamentoProduto.findUnique({
      where: { id: produtoLinhaId },
      select: { tratamento: { select: { experimentoId: true } } },
    });
    if (!tp) throw new NotFoundException("Linha de produto não encontrada.");
    return tp.tratamento.experimentoId;
  }

  async atualizar(id: string, user: UsuarioAtual, dto: { nome?: string; descricao?: string }) {
    await this.experimentos.garantirAcesso(await this.expIdDoTratamento(id), user, "edit");
    return this.prisma.tratamento.update({
      where: { id },
      data: { nome: dto.nome, descricao: dto.descricao },
    });
  }

  async adicionarProduto(tratamentoId: string, user: UsuarioAtual, dto: ProdutoLinhaDto) {
    await this.experimentos.garantirAcesso(
      await this.expIdDoTratamento(tratamentoId),
      user,
      "edit",
    );
    const seq =
      dto.seq ?? (await this.prisma.tratamentoProduto.count({ where: { tratamentoId } })) + 1;
    return this.prisma.tratamentoProduto.create({
      data: { tratamentoId, seq, produtoId: dto.produtoId, ...this.normalizar(dto) },
      include: { produto: true, timing: true, atividade: true },
    });
  }

  async atualizarProduto(id: string, user: UsuarioAtual, dto: Partial<ProdutoLinhaDto>) {
    await this.experimentos.garantirAcesso(await this.expIdDoProduto(id), user, "edit");
    return this.prisma.tratamentoProduto.update({
      where: { id },
      data: { ...(dto.produtoId ? { produtoId: dto.produtoId } : {}), ...this.normalizar(dto) },
      include: { produto: true, timing: true, atividade: true },
    });
  }

  async removerProduto(id: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(await this.expIdDoProduto(id), user, "edit");
    await this.prisma.tratamentoProduto.delete({ where: { id } });
    return { ok: true };
  }

  async listarTimings(experimentoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(experimentoId, user);
    return this.prisma.timing.findMany({ where: { experimentoId }, orderBy: { ordem: "asc" } });
  }
  async criarTiming(
    experimentoId: string,
    user: UsuarioAtual,
    dto: { nome: string; ordem?: number },
  ) {
    await this.experimentos.garantirAcesso(experimentoId, user, "edit");
    return this.prisma.timing.create({
      data: { experimentoId, nome: dto.nome, ordem: dto.ordem ?? 0 },
    });
  }

  private normalizar(dto: Partial<ProdutoLinhaDto>) {
    return {
      modoAplicacao: dto.modoAplicacao,
      dose: dto.dose,
      unidadeDose: dto.unidadeDose,
      volumeCaldaLha: dto.volumeCaldaLha,
      referencia: dto.referencia,
      timingId: dto.timingId || null,
      atividadeId: dto.atividadeId || null,
      descricao: dto.descricao,
    };
  }
}

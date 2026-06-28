import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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
  constructor(private readonly prisma: PrismaService) {}

  async atualizar(id: string, dto: { nome?: string; descricao?: string }) {
    await this.garantir(id);
    return this.prisma.tratamento.update({
      where: { id },
      data: { nome: dto.nome, descricao: dto.descricao },
    });
  }

  async adicionarProduto(tratamentoId: string, dto: ProdutoLinhaDto) {
    await this.garantir(tratamentoId);
    const seq =
      dto.seq ??
      ((await this.prisma.tratamentoProduto.count({ where: { tratamentoId } })) + 1);
    return this.prisma.tratamentoProduto.create({
      data: { tratamentoId, seq, produtoId: dto.produtoId, ...this.normalizar(dto) },
      include: { produto: true, timing: true, atividade: true },
    });
  }

  async atualizarProduto(id: string, dto: Partial<ProdutoLinhaDto>) {
    return this.prisma.tratamentoProduto.update({
      where: { id },
      data: {
        ...(dto.produtoId ? { produtoId: dto.produtoId } : {}),
        ...this.normalizar(dto),
      },
      include: { produto: true, timing: true, atividade: true },
    });
  }

  async removerProduto(id: string) {
    await this.prisma.tratamentoProduto.delete({ where: { id } });
    return { ok: true };
  }

  listarTimings(experimentoId: string) {
    return this.prisma.timing.findMany({
      where: { experimentoId },
      orderBy: { ordem: "asc" },
    });
  }
  criarTiming(experimentoId: string, dto: { nome: string; ordem?: number }) {
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

  private async garantir(tratamentoId: string) {
    const t = await this.prisma.tratamento.findUnique({ where: { id: tratamentoId } });
    if (!t) throw new NotFoundException("Tratamento não encontrado.");
  }
}

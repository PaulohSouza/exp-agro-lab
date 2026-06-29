import { Injectable, NotFoundException } from "@nestjs/common";
import { dedupLote, resolverColeta, chaveColeta, type ColetaOffline } from "@exp/domain";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

export interface ColetaPush extends ColetaOffline {
  obs?: string;
  dispositivoId?: string;
}

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly experimentos: ExperimentosService,
  ) {}

  /** Pacote para uso offline: estrutura + avaliações + lançamentos já existentes. */
  async pull(experimentoId: string, user: UsuarioAtual) {
    await this.experimentos.garantirAcesso(experimentoId, user);
    const exp = await this.prisma.experimento.findUnique({
      where: { id: experimentoId },
      select: {
        id: true, codigo: true, titulo: true, ensaio: true, status: true,
        espacamentoLinhasM: true, numRepeticoes: true,
        delineamento: { select: { nome: true } },
        tratamentos: { orderBy: { numeroRef: "asc" }, select: { id: true, numeroRef: true, tag: true, nome: true } },
        parcelas: { orderBy: { numero: "asc" }, select: { id: true, numero: true, bloco: true, posLinha: true, posColuna: true, isInicio: true, tratamentoId: true } },
        avaliacoes: { orderBy: { ordem: "asc" }, select: { id: true, nome: true, unidadeColeta: true, unidadeSaida: true, formula: true, tipo: true } },
      },
    });
    if (!exp) throw new NotFoundException("Experimento não encontrado.");
    const dados = await this.prisma.avaliacaoDado.findMany({
      where: { avaliacao: { experimentoId }, deletedAt: null },
      select: { avaliacaoId: true, parcelaId: true, numAmostra: true, valorColetado: true, updatedAt: true },
    });
    return { experimento: exp, dados, serverTime: Date.now() };
  }

  /** Recebe um lote de coletas offline. Idempotente + resolução de conflito (LWW). */
  async push(user: UsuarioAtual, coletas: ColetaPush[]) {
    const lote = dedupLote(coletas);
    const acessoCache = new Map<string, boolean>();
    let aplicados = 0;
    const conflitos: string[] = [];
    const ignorados: string[] = [];

    for (const c of lote) {
      const aval = await this.prisma.avaliacao.findUnique({ where: { id: c.avaliacaoId }, select: { experimentoId: true } });
      if (!aval) { ignorados.push(chaveColeta(c)); continue; }

      if (!acessoCache.has(aval.experimentoId)) {
        try { await this.experimentos.garantirAcesso(aval.experimentoId, user); acessoCache.set(aval.experimentoId, true); }
        catch { acessoCache.set(aval.experimentoId, false); }
      }
      if (!acessoCache.get(aval.experimentoId)) { ignorados.push(chaveColeta(c)); continue; }

      const existente = await this.prisma.avaliacaoDado.findUnique({
        where: { avaliacaoId_parcelaId_numAmostra: { avaliacaoId: c.avaliacaoId, parcelaId: c.parcelaId, numAmostra: c.numAmostra } },
        select: { id: true, updatedAt: true },
      });
      const serverUpdatedAt = existente ? existente.updatedAt.getTime() : null;

      if (resolverColeta(c.clientUpdatedAt, serverUpdatedAt) === "conflito") {
        conflitos.push(chaveColeta(c));
        continue;
      }

      await this.prisma.avaliacaoDado.upsert({
        where: { avaliacaoId_parcelaId_numAmostra: { avaliacaoId: c.avaliacaoId, parcelaId: c.parcelaId, numAmostra: c.numAmostra } },
        create: {
          avaliacaoId: c.avaliacaoId, parcelaId: c.parcelaId, numAmostra: c.numAmostra,
          valorColetado: c.valorColetado,
          obs: c.obs, origem: "mobile", dispositivoId: c.dispositivoId, syncedAt: new Date(),
        },
        update: {
          valorColetado: c.valorColetado,
          obs: c.obs, dispositivoId: c.dispositivoId, syncedAt: new Date(),
        },
      });
      aplicados++;
    }

    return { aplicados, conflitos, ignorados, total: lote.length };
  }
}

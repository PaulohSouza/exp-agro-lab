import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

/** Contagem rotulada (ex.: por local, por status). */
interface Contagem {
  rotulo: string;
  n: number;
}

function contar<T>(itens: readonly T[], chave: (x: T) => string | null | undefined): Contagem[] {
  const m = new Map<string, number>();
  for (const x of itens) {
    const k = chave(x) ?? "—";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([rotulo, n]) => ({ rotulo, n })).sort((a, b) => b.n - a.n);
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Filtro de experimentos conforme o papel (RN-RBAC):
   * - admin_sistema → todas as instituições;
   * - gestao_instituicao → a instituição inteira;
   * - gestao_departamento → experimentos cuja unidade pertence ao seu departamento;
   * - coordenador_area → experimentos da sua unidade/laboratório;
   * - pesquisador/analista/assistente → próprios + atribuídos (compartilhados).
   * O escopo por depto/área usa o vínculo atual do usuário no banco (não o JWT).
   */
  private escopo(
    user: UsuarioAtual,
    me: { departamentoId: string | null; unidadeId: string | null },
  ): Prisma.ExperimentoWhereInput {
    const base: Prisma.ExperimentoWhereInput = { deletedAt: null };
    switch (user.papel) {
      case "ADMIN_SISTEMA":
        return base;
      case "GESTAO_INSTITUICAO":
        return { ...base, instituicaoId: user.instituicaoId };
      case "GESTAO_DEPARTAMENTO":
        // sem departamento configurado → cai para a instituição (não quebra)
        return me.departamentoId
          ? {
              ...base,
              instituicaoId: user.instituicaoId,
              unidade: { departamentoId: me.departamentoId },
            }
          : { ...base, instituicaoId: user.instituicaoId };
      case "COORDENADOR_AREA":
        return me.unidadeId
          ? { ...base, instituicaoId: user.instituicaoId, unidadeId: me.unidadeId }
          : { ...base, instituicaoId: user.instituicaoId };
      default:
        return {
          ...base,
          OR: [
            { ownerId: user.userId },
            { compartilhamentos: { some: { userId: user.userId } } },
            { responsaveis: { some: { userId: user.userId } } },
          ],
        };
    }
  }

  async resumo(user: UsuarioAtual) {
    const me = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { departamentoId: true, unidadeId: true },
    });
    const where = this.escopo(user, me ?? { departamentoId: null, unidadeId: null });

    const exps = await this.prisma.experimento.findMany({
      where,
      select: {
        id: true,
        status: true,
        ensaio: true,
        local: { select: { nome: true } },
        areaPesquisa: { select: { nome: true } },
        safra: { select: { nome: true } },
      },
    });

    // Checklist DERIVADO: cada Avaliacao com dataPrevista vira Realizada/Pendente/Atrasada.
    const expIds = exps.map((e) => e.id);
    const avals = expIds.length
      ? await this.prisma.avaliacao.findMany({
          where: { experimentoId: { in: expIds }, dataPrevista: { not: null } },
          select: {
            nome: true,
            dataPrevista: true,
            experimento: { select: { id: true, titulo: true } },
            dados: {
              where: { valorColetado: { not: null }, deletedAt: null },
              select: { id: true },
              take: 1,
            },
          },
        })
      : [];

    const hoje = new Date();
    let realizadas = 0;
    let pendentes = 0;
    let atrasadas = 0;
    const itens = avals.map((a) => {
      const feita = a.dados.length > 0;
      const atrasada = !feita && a.dataPrevista! < hoje;
      const estado = feita ? "realizada" : atrasada ? "atrasada" : "pendente";
      if (feita) realizadas++;
      else if (atrasada) atrasadas++;
      else pendentes++;
      return {
        avaliacao: a.nome,
        experimento: a.experimento.titulo,
        experimentoId: a.experimento.id,
        dataPrevista: a.dataPrevista,
        estado,
      };
    });
    // destaque: pendências/atrasos mais próximos primeiro
    const destaque = itens
      .filter((i) => i.estado !== "realizada")
      .sort((x, y) => x.dataPrevista!.getTime() - y.dataPrevista!.getTime())
      .slice(0, 12);

    return {
      escopo: user.papel,
      totais: {
        experimentos: exps.length,
        emConducao: exps.filter((e) => e.status === "EM_CONDUCAO").length,
      },
      porStatus: contar(exps, (e) => e.status),
      porEnsaio: contar(exps, (e) => e.ensaio),
      porLocal: contar(exps, (e) => e.local?.nome),
      porArea: contar(exps, (e) => e.areaPesquisa?.nome),
      porSafra: contar(exps, (e) => e.safra?.nome),
      checklist: { previstas: avals.length, realizadas, pendentes, atrasadas, itens: destaque },
    };
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** Leitura do dicionário de valores enumerados (D6 / §4.9). */
@Injectable()
export class DominiosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Todos os domínios ativos, agrupados por domínio (ordenados). */
  async listar(): Promise<
    Record<string, { codigo: string; rotulo: string; descricao: string | null }[]>
  > {
    const linhas = await this.prisma.dominioValor.findMany({
      where: { isAtivo: true },
      orderBy: [{ dominio: "asc" }, { ordem: "asc" }],
    });
    const agrupado: Record<string, { codigo: string; rotulo: string; descricao: string | null }[]> =
      {};
    for (const l of linhas) {
      (agrupado[l.dominio] ??= []).push({
        codigo: l.codigo,
        rotulo: l.rotulo,
        descricao: l.descricao,
      });
    }
    return agrupado;
  }

  /** Valores de um domínio específico (ex.: "StatusExperimento"). */
  listarPorDominio(dominio: string) {
    return this.prisma.dominioValor.findMany({
      where: { dominio, isAtivo: true },
      orderBy: { ordem: "asc" },
      select: { codigo: true, rotulo: true, descricao: true },
    });
  }
}

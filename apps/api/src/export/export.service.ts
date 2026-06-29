import { Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { calcularSaida } from "@exp/domain";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly experimentos: ExperimentosService,
  ) {}

  async experimentoXlsx(id: string, user: UsuarioAtual): Promise<Buffer> {
    await this.experimentos.garantirAcesso(id, user);
    const exp = await this.prisma.experimento.findUniqueOrThrow({
      where: { id },
      include: {
        objetoEstudo: true,
        local: true,
        safra: true,
        areaPesquisa: true,
        delineamento: true,
        tratamentos: { orderBy: { numeroRef: "asc" } },
        parcelas: { orderBy: { numero: "asc" }, include: { tratamento: true } },
        avaliacoes: { orderBy: { ordem: "asc" } },
      },
    });
    const dados = await this.prisma.avaliacaoDado.findMany({
      where: { avaliacao: { experimentoId: id }, deletedAt: null },
      include: { avaliacao: true, parcela: { include: { tratamento: true } } },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "EXP-AGROLAB";

    const geral = wb.addWorksheet("Geral");
    geral.columns = [
      { header: "Campo", width: 24 },
      { header: "Valor", width: 50 },
    ];
    const linhasGeral: [string, string | number | null][] = [
      ["Código", exp.codigo],
      ["Título", exp.titulo],
      ["Ensaio", exp.ensaio],
      ["Status", exp.status],
      ["Objeto de estudo", exp.objetoEstudo?.nome ?? ""],
      ["Cultivar", exp.cultivar ?? ""],
      ["Área de pesquisa", exp.areaPesquisa?.nome ?? ""],
      ["Local", exp.local?.nome ?? ""],
      ["Safra", exp.safra?.nome ?? ""],
      ["Delineamento", exp.delineamento?.nome ?? ""],
      ["Repetições", exp.numeroRepeticoes],
      ["Tratamentos", exp.numeroTratamentos],
      ["Total parcelas", exp.totalParcelas],
      ["Espaçamento linhas (m)", exp.espacamentoLinhasM],
      ["Objetivo", exp.objetivo ?? ""],
    ];
    linhasGeral.forEach((l) => geral.addRow(l));
    geral.getRow(1).font = { bold: true };

    const trat = wb.addWorksheet("Tratamentos");
    trat.columns = [
      { header: "Trat.", width: 8 },
      { header: "Tag", width: 8 },
      { header: "Nome", width: 40 },
    ];
    exp.tratamentos.forEach((t) => trat.addRow([t.numeroRef, t.tag, t.nome]));
    trat.getRow(1).font = { bold: true };

    const croqui = wb.addWorksheet("Croqui");
    croqui.columns = [
      { header: "Parcela", width: 10 },
      { header: "Bloco", width: 8 },
      { header: "Linha", width: 8 },
      { header: "Coluna", width: 8 },
      { header: "Tratamento", width: 12 },
      { header: "Início", width: 8 },
    ];
    exp.parcelas.forEach((p) =>
      croqui.addRow([
        p.numero,
        p.bloco,
        p.posicaoLinha,
        p.posicaoColuna,
        p.tratamento?.tag ?? "",
        p.isInicio ? "sim" : "",
      ]),
    );
    croqui.getRow(1).font = { bold: true };

    const ws = wb.addWorksheet("Dados");
    ws.columns = [
      { header: "Avaliação", width: 22 },
      { header: "Parcela", width: 10 },
      { header: "Bloco", width: 8 },
      { header: "Tratamento", width: 12 },
      { header: "Valor coletado", width: 14 },
      { header: "Área útil (m²)", width: 14 },
      { header: "Valor saída", width: 14 },
      { header: "Unid. saída", width: 12 },
    ];
    // Área útil única do ensaio: vem da atividade de Colheita (RN-PROD / C5).
    const espac = exp.espacamentoLinhasM ?? undefined;
    const colheita = await this.prisma.atividadeExperimento.findFirst({
      where: { experimentoId: id, modelo: { isFonteAreaColheita: true } },
      include: { valores: true },
    });
    const linhasC = colheita?.valores.find((v) => v.rotulo === "linhas")?.valorNum ?? undefined;
    const compC = colheita?.valores.find((v) => v.rotulo === "comprimento")?.valorNum ?? undefined;
    const areaUtil = espac && linhasC && compC ? linhasC * espac * compC : undefined;
    for (const d of dados) {
      let saida: number | null = null;
      if (d.avaliacao.formula && d.valorColetado != null) {
        try {
          saida = calcularSaida({
            valorColetado: d.valorColetado,
            formula: d.avaliacao.formula,
            params: areaUtil ? { areaUtil } : {},
          });
        } catch {
          saida = null;
        }
      }
      ws.addRow([
        d.avaliacao.nome,
        d.parcela.numero,
        d.parcela.bloco,
        d.parcela.tratamento?.tag ?? "",
        d.valorColetado,
        areaUtil ?? null,
        saida != null ? Number(saida.toFixed(2)) : null,
        d.avaliacao.unidadeSaida ?? "",
      ]);
    }
    ws.getRow(1).font = { bold: true };

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}

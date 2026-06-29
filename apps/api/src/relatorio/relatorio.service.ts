import { Injectable } from "@nestjs/common";
import pptxgen from "pptxgenjs";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import { AvaliacoesService } from "../avaliacoes/avaliacoes.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const NAVY = "1F2940";
const SKY = "4EC2F0";
const GREEN = "6FA830";

@Injectable()
export class RelatorioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly experimentos: ExperimentosService,
    private readonly avaliacoes: AvaliacoesService,
  ) {}

  async gerarPptx(experimentoId: string, user: UsuarioAtual): Promise<Buffer> {
    await this.experimentos.garantirAcesso(experimentoId, user);
    const exp = await this.prisma.experimento.findUniqueOrThrow({
      where: { id: experimentoId },
      include: {
        objetoEstudo: true,
        local: true,
        safra: true,
        areaPesquisa: true,
        delineamento: true,
        avaliacoes: { orderBy: { ordem: "asc" } },
      },
    });

    const pptx = new pptxgen();
    pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
    pptx.layout = "WIDE";
    pptx.author = "EXP-AgroLab";

    // ---- Capa ----
    const capa = pptx.addSlide();
    capa.background = { color: NAVY };
    capa.addText("SAGRE · EXP-AgroLab", {
      x: 0.7,
      y: 2.0,
      fontSize: 14,
      color: SKY,
      charSpacing: 2,
    });
    capa.addText(`${exp.codigo ? exp.codigo + " — " : ""}${exp.titulo}`, {
      x: 0.7,
      y: 2.5,
      w: 12,
      fontSize: 32,
      bold: true,
      color: "FFFFFF",
    });
    if (exp.objetivo)
      capa.addText(exp.objetivo, { x: 0.7, y: 3.9, w: 11.5, fontSize: 14, color: "9BD2F5" });
    capa.addText(
      [exp.objetoEstudo?.nome, exp.local?.nome, exp.safra?.nome, exp.delineamento?.nome]
        .filter(Boolean)
        .join("  ·  "),
      { x: 0.7, y: 6.6, fontSize: 12, color: SKY },
    );

    // ---- Resumo ----
    const resumo = pptx.addSlide();
    this.titulo(resumo, "Resumo do experimento");
    const meta: [string, string][] = [
      ["Ensaio", exp.ensaio],
      ["Status", exp.status],
      ["Objeto de estudo", exp.objetoEstudo?.nome ?? "—"],
      ["Cultivar", exp.cultivar ?? "—"],
      ["Área de pesquisa", exp.areaPesquisa?.nome ?? "—"],
      ["Local", exp.local?.nome ?? "—"],
      ["Safra", exp.safra?.nome ?? "—"],
      ["Delineamento", exp.delineamento?.nome ?? "—"],
      ["Tratamentos", String(exp.numeroTratamentos ?? "—")],
      ["Repetições", String(exp.numeroRepeticoes ?? "—")],
      ["Total de parcelas", String(exp.totalParcelas ?? "—")],
    ];
    resumo.addTable(
      meta.map(([k, v]) => [
        { text: k, options: { bold: true, color: NAVY, fill: { color: "EAF0FA" } } },
        { text: v, options: { color: "333333" } },
      ]),
      {
        x: 0.7,
        y: 1.4,
        w: 7,
        fontSize: 13,
        border: { type: "solid", color: "E1E1EF", pt: 1 },
        rowH: 0.32,
      },
    );

    // ---- Uma seção por avaliação com dados analisáveis ----
    for (const aval of exp.avaliacoes) {
      let analise;
      try {
        analise = await this.avaliacoes.analise(aval.id, user);
      } catch {
        continue; // sem dados suficientes
      }
      const r = analise.resultado;
      const slide = pptx.addSlide();
      this.titulo(
        slide,
        `Análise — ${aval.nome}${aval.unidadeSaida ? ` (${aval.unidadeSaida})` : ""}`,
      );

      // Tabela ANOVA
      const head = ["Fonte", "GL", "SQ", "QM", "F", "p"].map((t) => ({
        text: t,
        options: { bold: true, color: "FFFFFF", fill: { color: NAVY } },
      }));
      const linhas = r.tabela.map((l) => [
        { text: l.fonte },
        { text: String(l.gl) },
        { text: l.sq.toFixed(2) },
        { text: l.qm.toFixed(2) },
        { text: l.f != null ? l.f.toFixed(2) : "—" },
        { text: l.p != null ? (l.p < 0.001 ? "<0.001" : l.p.toFixed(3)) : "—" },
      ]);
      slide.addTable([head, ...linhas], {
        x: 0.7,
        y: 1.4,
        w: 6.6,
        fontSize: 12,
        border: { type: "solid", color: "E1E1EF", pt: 1 },
        rowH: 0.3,
      });
      slide.addText(
        `CV = ${r.cv.toFixed(2)}%   ·   ${r.significativo ? "tratamento significativo" : "não significativo"}   ·   Bartlett p = ${r.pressupostos.bartlettP.toFixed(3)}   ·   ${r.comparacao.metodo}`,
        { x: 0.7, y: 4.3, w: 6.6, fontSize: 11, color: "555555" },
      );

      // Tabela de médias + letras
      const headM = ["Trat.", "Média", ""].map((t) => ({
        text: t,
        options: { bold: true, color: "FFFFFF", fill: { color: GREEN } },
      }));
      const linhasM = r.medias.map((m) => [
        { text: m.tratamento, options: { bold: true } },
        { text: m.media.toFixed(1) },
        { text: m.letra ?? "", options: { bold: true, color: "2D6CDF" } },
      ]);
      slide.addTable([headM, ...linhasM], {
        x: 7.7,
        y: 1.4,
        w: 2.6,
        fontSize: 12,
        border: { type: "solid", color: "E1E1EF", pt: 1 },
        rowH: 0.3,
      });

      // Gráfico de barras das médias
      slide.addChart(
        pptx.ChartType.bar,
        [
          {
            name: aval.nome,
            labels: r.medias.map((m) => m.tratamento),
            values: r.medias.map((m) => Number(m.media.toFixed(2))),
          },
        ],
        {
          x: 7.7,
          y: 4.0,
          w: 5.0,
          h: 3.0,
          showTitle: false,
          showLegend: false,
          barDir: "col",
          chartColors: [SKY],
          catAxisLabelFontSize: 10,
          valAxisLabelFontSize: 9,
        },
      );
    }

    return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  }

  private titulo(slide: pptxgen.Slide, texto: string) {
    slide.addText(texto, { x: 0.7, y: 0.5, w: 12, fontSize: 22, bold: true, color: NAVY });
    slide.addShape("line" as never, {
      x: 0.7,
      y: 1.2,
      w: 12,
      h: 0,
      line: { color: SKY, width: 2 },
    });
  }
}

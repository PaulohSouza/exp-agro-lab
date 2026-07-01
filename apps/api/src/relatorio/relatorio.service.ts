import { Injectable } from "@nestjs/common";
import pptxgen from "pptxgenjs";
import { PrismaService } from "../prisma/prisma.service";
import { ExperimentosService } from "../experimentos/experimentos.service";
import { AvaliacoesService } from "../avaliacoes/avaliacoes.service";
import type { UsuarioAtual } from "../auth/jwt.strategy";

// Paleta do tema do TCC (o layout espelha o modelo SAGRE/Fundação MT, mas a
// marca — nome da organização, rodapé — vem da instituição do experimento).
const NAVY = "1F2940";
const SKY = "4EC2F0";
const GREEN = "6FA830";
const CINZA = "555555";
const LINHA = "E1E1EF";
const FONT = "Arial";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Contexto de marca/cabeçalho derivado do experimento (multi-tenant). */
interface ContextoRelatorio {
  organizacao: string;
  protocolo: string;
  titulo: string;
  cultura: string;
  periodo: string;
  local: string;
  rodape: string;
}

/** Média de tratamento coletada para a tabela de sumarização. */
interface MediaSumarizacao {
  nome: string;
  unidade: string | null;
  medias: { tratamento: string; media: number; letra?: string }[];
}

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
        instituicao: true,
        objetoEstudo: true,
        local: true,
        safra: true,
        areaPesquisa: true,
        delineamento: true,
        avaliacoes: { orderBy: { ordem: "asc" } },
      },
    });

    const ctx = this.contexto(exp);

    const pptx = new pptxgen();
    pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
    pptx.layout = "WIDE";
    pptx.author = ctx.organizacao;
    pptx.company = ctx.organizacao;

    const numero = { n: 0 };

    // ---- Capa ----
    this.capa(pptx, ctx);

    // ---- Informações gerais ----
    this.infoGerais(pptx, ctx, exp, numero);

    // ---- Metodologia / Análise Estatística ----
    this.metodologia(pptx, ctx, exp, numero);

    // ---- Divisor de resultados ----
    this.divisor(pptx, "Resultados", numero);

    // ---- Uma seção por avaliação com dados analisáveis ----
    const sumarizacao: MediaSumarizacao[] = [];
    for (const aval of exp.avaliacoes) {
      let analise;
      try {
        analise = await this.avaliacoes.analise(aval.id, user);
      } catch {
        continue; // sem dados suficientes
      }
      // o relatório nunca pede o teste não-paramétrico (rota só da tela de Análise)
      if ("teste" in analise && analise.teste === "naoParametrico") continue;

      if (analise.esquema === "PARCELA_SUBDIVIDIDA") {
        this.slideSplit(pptx, ctx, aval, analise.resultado, numero);
      } else if (analise.esquema === "FATORIAL") {
        this.slideFatorial(pptx, ctx, aval, analise.resultado, numero);
      } else {
        this.slideResultado(pptx, ctx, aval, analise.resultado, numero);
        sumarizacao.push({
          nome: aval.nome,
          unidade: aval.unidadeSaida,
          medias: analise.resultado.medias,
        });
      }
    }

    // ---- Sumarização (tratamentos × variáveis, com letras) ----
    if (sumarizacao.length) this.sumarizacao(pptx, ctx, sumarizacao, numero);

    return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  }

  // ---------------------------------------------------------------------------
  // Contexto / marca
  // ---------------------------------------------------------------------------
  private contexto(exp: {
    instituicao: { nome: string };
    codigo: string | null;
    titulo: string;
    objetoEstudo: { nome: string } | null;
    local: { nome: string } | null;
    safra: { nome: string } | null;
    anoSemestre: string | null;
    tipoPeriodo: string;
  }): ContextoRelatorio {
    const organizacao = exp.instituicao.nome;
    const protocolo = exp.codigo ?? "";
    const cultura = exp.objetoEstudo?.nome ?? "";
    const periodo =
      exp.tipoPeriodo === "ANO_SEMESTRE" ? (exp.anoSemestre ?? "") : (exp.safra?.nome ?? "");
    const local = exp.local?.nome ?? "";
    const rodape = [
      `${organizacao}${protocolo ? `: ${protocolo}` : ""} - ${exp.titulo}`,
      local,
      [cultura, periodo].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join("  |  ");
    return { organizacao, protocolo, titulo: exp.titulo, cultura, periodo, local, rodape };
  }

  // ---------------------------------------------------------------------------
  // Slides estruturais
  // ---------------------------------------------------------------------------
  private capa(pptx: pptxgen, ctx: ContextoRelatorio) {
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText(ctx.organizacao.toUpperCase(), {
      x: 0.7,
      y: 0.6,
      w: 12,
      fontSize: 24,
      bold: true,
      color: SKY,
      fontFace: FONT,
      charSpacing: 1,
    });
    s.addText(`Relatório Final: ${[ctx.cultura, ctx.periodo].filter(Boolean).join(" – ")}`, {
      x: 0.7,
      y: 2.1,
      w: 12,
      h: 0.5,
      fontSize: 24,
      color: "9BD2F5",
      fontFace: FONT,
    });
    s.addText(`${ctx.protocolo ? ctx.protocolo + " — " : ""}${ctx.titulo}`, {
      x: 0.7,
      y: 3.0,
      w: 12,
      h: 2.0,
      fontSize: 40,
      bold: true,
      color: "FFFFFF",
      fontFace: FONT,
      valign: "top",
    });
    const hoje = new Date();
    s.addText(`${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}`, {
      x: 0.7,
      y: 6.7,
      w: 12,
      fontSize: 16,
      color: GREEN,
      fontFace: FONT,
    });
    if (ctx.local)
      s.addText(ctx.local, { x: 0.7, y: 6.3, w: 12, fontSize: 14, color: SKY, fontFace: FONT });
  }

  /** Cria um slide de conteúdo com o rodapé padrão (marca + número). */
  private slide(pptx: pptxgen, ctx: ContextoRelatorio, numero: { n: number }): pptxgen.Slide {
    numero.n += 1;
    const s = pptx.addSlide();
    s.addShape("line" as never, {
      x: 0.7,
      y: 7.05,
      w: 11.9,
      h: 0,
      line: { color: LINHA, width: 1 },
    });
    s.addText(ctx.rodape, {
      x: 0.7,
      y: 7.1,
      w: 11,
      h: 0.35,
      fontSize: 9,
      color: CINZA,
      fontFace: FONT,
      valign: "middle",
    });
    s.addText(String(numero.n), {
      x: 12.2,
      y: 7.1,
      w: 0.9,
      h: 0.35,
      fontSize: 9,
      color: CINZA,
      fontFace: FONT,
      align: "right",
      valign: "middle",
    });
    return s;
  }

  private titulo(slide: pptxgen.Slide, texto: string) {
    slide.addText(texto, {
      x: 0.7,
      y: 0.4,
      w: 12,
      fontSize: 26,
      bold: true,
      color: NAVY,
      fontFace: FONT,
    });
    slide.addShape("line" as never, {
      x: 0.7,
      y: 1.2,
      w: 11.9,
      h: 0,
      line: { color: SKY, width: 2 },
    });
  }

  private divisor(pptx: pptxgen, texto: string, numero: { n: number }) {
    numero.n += 1;
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText(texto, {
      x: 0.7,
      y: 3.0,
      w: 12,
      h: 1.2,
      fontSize: 44,
      bold: true,
      color: "FFFFFF",
      fontFace: FONT,
      align: "left",
    });
    s.addShape("line" as never, { x: 0.75, y: 4.2, w: 3.5, h: 0, line: { color: SKY, width: 3 } });
    s.addText(String(numero.n), {
      x: 12.2,
      y: 7.1,
      w: 0.9,
      h: 0.35,
      fontSize: 9,
      color: SKY,
      fontFace: FONT,
      align: "right",
      valign: "middle",
    });
  }

  private infoGerais(
    pptx: pptxgen,
    ctx: ContextoRelatorio,
    exp: {
      ensaio: string;
      status: string;
      objetoEstudo: { nome: string } | null;
      cultivar: string | null;
      areaPesquisa: { nome: string } | null;
      local: { nome: string } | null;
      delineamento: { nome: string } | null;
      numeroTratamentos: number | null;
      numeroRepeticoes: number | null;
      totalParcelas: number | null;
    },
    numero: { n: number },
  ) {
    const s = this.slide(pptx, ctx, numero);
    this.titulo(s, "Informações Gerais");
    const meta: [string, string][] = [
      ["Protocolo", ctx.protocolo || "—"],
      ["Fluxo", exp.ensaio],
      ["Status", exp.status],
      ["Objeto de estudo", exp.objetoEstudo?.nome ?? "—"],
      ["Cultivar", exp.cultivar ?? "—"],
      ["Área de pesquisa", exp.areaPesquisa?.nome ?? "—"],
      ["Local", exp.local?.nome ?? "—"],
      ["Período", ctx.periodo || "—"],
      ["Delineamento", exp.delineamento?.nome ?? "—"],
      ["Tratamentos", String(exp.numeroTratamentos ?? "—")],
      ["Repetições", String(exp.numeroRepeticoes ?? "—")],
      ["Total de parcelas", String(exp.totalParcelas ?? "—")],
    ];
    s.addTable(
      meta.map(([k, v]) => [
        {
          text: k,
          options: { bold: true, color: NAVY, fill: { color: "EAF0FA" }, fontFace: FONT },
        },
        { text: v, options: { color: "333333", fontFace: FONT } },
      ]),
      {
        x: 0.7,
        y: 1.5,
        w: 7.5,
        fontSize: 13,
        border: { type: "solid", color: LINHA, pt: 1 },
        rowH: 0.32,
      },
    );
  }

  private metodologia(
    pptx: pptxgen,
    ctx: ContextoRelatorio,
    exp: {
      delineamento: { nome: string } | null;
      numeroTratamentos: number | null;
      numeroRepeticoes: number | null;
    },
    numero: { n: number },
  ) {
    const s = this.slide(pptx, ctx, numero);
    this.titulo(s, "Análise Estatística");
    const delin = exp.delineamento?.nome ?? "delineamento definido";
    const trat = exp.numeroTratamentos ? `${exp.numeroTratamentos} tratamentos` : "os tratamentos";
    const rep = exp.numeroRepeticoes ? `${exp.numeroRepeticoes} repetições` : "as repetições";
    const texto = [
      `O ensaio foi conduzido em ${delin}, com ${trat} e ${rep}.`,
      "Os dados foram submetidos à análise de variância (ANOVA). Quando o teste F foi significativo, " +
        "as médias dos tratamentos foram comparadas pelo teste de Tukey a 5% de probabilidade.",
      "A homogeneidade das variâncias foi verificada pelo teste de Bartlett e a normalidade dos resíduos " +
        "pelo teste de Shapiro-Wilk; quando os pressupostos foram violados, avaliou-se a transformação da " +
        "resposta (√, log ou Box-Cox) ou o uso de testes não-paramétricos.",
      "As análises estatísticas foram realizadas no sistema EXP-AgroLab (metodologia portada do SAGRE).",
    ];
    s.addText(
      texto.map((t) => ({ text: t, options: { breakLine: true, paraSpaceAfter: 10 } })),
      {
        x: 0.7,
        y: 1.6,
        w: 11.9,
        h: 5,
        fontSize: 15,
        color: "333333",
        fontFace: FONT,
        valign: "top",
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Slides de resultado
  // ---------------------------------------------------------------------------
  private cabecalhoAnova() {
    return ["Fonte", "GL", "SQ", "QM", "F", "p"].map((t) => ({
      text: t,
      options: { bold: true, color: "FFFFFF", fill: { color: NAVY }, fontFace: FONT },
    }));
  }

  private linhaAnova(l: {
    fonte: string;
    gl: number;
    sq: number;
    qm?: number;
    f?: number;
    p?: number;
  }) {
    return [
      { text: l.fonte, options: { fontFace: FONT } },
      { text: String(l.gl), options: { fontFace: FONT } },
      { text: l.sq.toFixed(2), options: { fontFace: FONT } },
      { text: l.qm != null ? l.qm.toFixed(2) : "—", options: { fontFace: FONT } },
      { text: l.f != null ? l.f.toFixed(2) : "—", options: { fontFace: FONT } },
      {
        text: l.p != null ? (l.p < 0.001 ? "<0.001" : l.p.toFixed(3)) : "—",
        options: { fontFace: FONT },
      },
    ];
  }

  private notaLetras(slide: pptxgen.Slide, metodo: string) {
    slide.addText(
      `Médias seguidas pela mesma letra não diferem entre si pelo teste de ${metodo} a 5% de probabilidade.`,
      { x: 0.7, y: 6.6, w: 11, h: 0.35, fontSize: 10, italic: true, color: CINZA, fontFace: FONT },
    );
  }

  /** Slide de resultado padrão (1 fator): título + gráfico de barras + tabela médias/letras. */
  private slideResultado(
    pptx: pptxgen,
    ctx: ContextoRelatorio,
    aval: { nome: string; unidadeSaida: string | null },
    r: {
      tabela: { fonte: string; gl: number; sq: number; qm?: number; f?: number; p?: number }[];
      cv: number;
      significativo: boolean;
      comparacao: { metodo: string };
      medias: { tratamento: string; media: number; letra?: string }[];
    },
    numero: { n: number },
  ) {
    const s = this.slide(pptx, ctx, numero);
    this.titulo(
      s,
      `Resultados – ${aval.nome}${aval.unidadeSaida ? ` (${aval.unidadeSaida})` : ""}`,
    );

    // Gráfico de barras das médias (valores; as letras ficam na tabela ao lado).
    s.addChart(
      pptx.ChartType.bar,
      [
        {
          name: aval.nome,
          labels: r.medias.map((m) => m.tratamento),
          values: r.medias.map((m) => Number(m.media.toFixed(2))),
        },
      ],
      {
        x: 0.7,
        y: 1.5,
        w: 7.6,
        h: 4.7,
        showTitle: false,
        showLegend: false,
        barDir: "col",
        chartColors: [SKY],
        catAxisLabelFontSize: 10,
        valAxisLabelFontSize: 9,
        showValue: true,
        dataLabelFontSize: 9,
        dataLabelPosition: "outEnd",
        dataLabelColor: NAVY,
        dataLabelFormatCode: "0.0",
      },
    );

    // Tabela de médias + letras à direita.
    const headM = ["Trat.", "Média", ""].map((t) => ({
      text: t,
      options: { bold: true, color: "FFFFFF", fill: { color: GREEN }, fontFace: FONT },
    }));
    const linhasM = r.medias.map((m) => [
      { text: m.tratamento, options: { bold: true, fontFace: FONT } },
      { text: m.media.toFixed(1), options: { fontFace: FONT } },
      { text: m.letra ?? "", options: { bold: true, color: "2D6CDF", fontFace: FONT } },
    ]);
    s.addTable([headM, ...linhasM], {
      x: 9.0,
      y: 1.5,
      w: 3.6,
      fontSize: 12,
      border: { type: "solid", color: LINHA, pt: 1 },
      rowH: 0.3,
    });
    s.addText(
      `CV = ${r.cv.toFixed(2)}%   ·   Teste F ${r.significativo ? "significativo" : "não significativo"}`,
      { x: 9.0, y: 6.15, w: 3.6, fontSize: 11, color: CINZA, fontFace: FONT },
    );
    this.notaLetras(s, r.comparacao.metodo);
  }

  /** Slide de resultado fatorial (erro único): ANOVA + médias por fator. */
  private slideFatorial(
    pptx: pptxgen,
    ctx: ContextoRelatorio,
    aval: { nome: string; unidadeSaida: string | null },
    rf: {
      tabela: { fonte: string; gl: number; sq: number; qm?: number; f?: number; p?: number }[];
      cv: number;
      comparacao: { metodo: string };
      interacoes: { fonte: string; significativo: boolean }[];
      efeitosPrincipais: {
        fator: string;
        medias: { nivel: string; media: number; letra?: string }[];
      }[];
      desdobramentos: { descricao: string }[];
      desdobramentosTriplos: { descricao: string }[];
    },
    numero: { n: number },
  ) {
    const s = this.slide(pptx, ctx, numero);
    this.titulo(
      s,
      `Resultados – ${aval.nome}${aval.unidadeSaida ? ` (${aval.unidadeSaida})` : ""} (fatorial)`,
    );
    s.addTable([this.cabecalhoAnova(), ...rf.tabela.map((l) => this.linhaAnova(l))], {
      x: 0.7,
      y: 1.5,
      w: 6.6,
      fontSize: 12,
      border: { type: "solid", color: LINHA, pt: 1 },
      rowH: 0.3,
    });
    const resumoInteracoes = rf.interacoes
      .map((i) => `${i.fonte} ${i.significativo ? "signif." : "n.s."}`)
      .join("   ·   ");
    s.addText(`CV = ${rf.cv.toFixed(2)}%   ·   ${resumoInteracoes}   ·   ${rf.comparacao.metodo}`, {
      x: 0.7,
      y: 5.6,
      w: 6.6,
      fontSize: 11,
      color: CINZA,
      fontFace: FONT,
    });

    let yEf = 1.5;
    for (const ef of rf.efeitosPrincipais) {
      const headEf = [ef.fator, "Média", ""].map((t) => ({
        text: t,
        options: { bold: true, color: "FFFFFF", fill: { color: GREEN }, fontFace: FONT },
      }));
      const linhasEf = ef.medias.map((m) => [
        { text: m.nivel, options: { bold: true, fontFace: FONT } },
        { text: m.media.toFixed(1), options: { fontFace: FONT } },
        { text: m.letra ?? "", options: { bold: true, color: "2D6CDF", fontFace: FONT } },
      ]);
      s.addTable([headEf, ...linhasEf], {
        x: 7.7,
        y: yEf,
        w: 2.8,
        fontSize: 11,
        border: { type: "solid", color: LINHA, pt: 1 },
        rowH: 0.28,
      });
      yEf += 0.28 * (ef.medias.length + 1) + 0.3;
    }
    const desc = [
      ...rf.desdobramentos.map((d) => d.descricao),
      ...rf.desdobramentosTriplos.map((d) => d.descricao),
    ];
    if (desc.length) {
      s.addText(
        `Interação significativa → desdobramento em efeitos simples (${desc.join("; ")}).`,
        {
          x: 0.7,
          y: 6.1,
          w: 6.6,
          fontSize: 10,
          italic: true,
          color: CINZA,
          fontFace: FONT,
        },
      );
    }
    this.notaLetras(s, rf.comparacao.metodo);
  }

  /** Slide de resultado split-plot: tabela de dois erros. */
  private slideSplit(
    pptx: pptxgen,
    ctx: ContextoRelatorio,
    aval: { nome: string; unidadeSaida: string | null },
    rs: {
      tabela: { fonte: string; gl: number; sq: number; qm?: number; f?: number; p?: number }[];
      cvParcela: number;
      cvSubparcela: number;
      fatorA: { significativo: boolean };
      fatorB: { significativo: boolean };
      interacao: { significativo: boolean };
    },
    numero: { n: number },
  ) {
    const s = this.slide(pptx, ctx, numero);
    this.titulo(
      s,
      `Resultados – ${aval.nome}${aval.unidadeSaida ? ` (${aval.unidadeSaida})` : ""} (split-plot)`,
    );
    s.addTable([this.cabecalhoAnova(), ...rs.tabela.map((l) => this.linhaAnova(l))], {
      x: 0.7,
      y: 1.5,
      w: 7.5,
      fontSize: 12,
      border: { type: "solid", color: LINHA, pt: 1 },
      rowH: 0.3,
    });
    s.addText(
      `CV(parcela) = ${rs.cvParcela.toFixed(2)}%   ·   CV(subparcela) = ${rs.cvSubparcela.toFixed(2)}%   ·   ` +
        `A ${rs.fatorA.significativo ? "signif." : "n.s."}   ·   B ${rs.fatorB.significativo ? "signif." : "n.s."}   ·   ` +
        `A×B ${rs.interacao.significativo ? "signif." : "n.s."}`,
      { x: 0.7, y: 5.4, w: 11, fontSize: 11, color: CINZA, fontFace: FONT },
    );
  }

  /** Tabela de sumarização: tratamentos (linhas) × variáveis (colunas), média + letra. */
  private sumarizacao(
    pptx: pptxgen,
    ctx: ContextoRelatorio,
    dados: MediaSumarizacao[],
    numero: { n: number },
  ) {
    const s = this.slide(pptx, ctx, numero);
    this.titulo(s, "Resultados – Sumarização");

    // união dos tratamentos preservando a ordem de aparição
    const tratamentos: string[] = [];
    for (const d of dados)
      for (const m of d.medias)
        if (!tratamentos.includes(m.tratamento)) tratamentos.push(m.tratamento);

    const head = [
      {
        text: "Trat.",
        options: { bold: true, color: "FFFFFF", fill: { color: NAVY }, fontFace: FONT },
      },
      ...dados.map((d) => ({
        text: `${d.nome}${d.unidade ? `\n(${d.unidade})` : ""}`,
        options: {
          bold: true,
          color: "FFFFFF",
          fill: { color: NAVY },
          fontFace: FONT,
          align: "center" as const,
        },
      })),
    ];
    const linhas = tratamentos.map((t) => [
      { text: t, options: { bold: true, fontFace: FONT } },
      ...dados.map((d) => {
        const m = d.medias.find((x) => x.tratamento === t);
        return {
          text: m ? `${m.media.toFixed(1)} ${m.letra ?? ""}`.trim() : "—",
          options: { fontFace: FONT, align: "center" as const },
        };
      }),
    ]);
    s.addTable([head, ...linhas], {
      x: 0.7,
      y: 1.5,
      w: 11.9,
      fontSize: 12,
      border: { type: "solid", color: LINHA, pt: 1 },
      rowH: 0.32,
      valign: "middle",
    });
    this.notaLetras(s, "Tukey");
    s.addText("Tabela. Valores médios e agrupamento estatístico das variáveis analisadas.", {
      x: 0.7,
      y: 6.2,
      w: 11,
      fontSize: 11,
      italic: true,
      color: CINZA,
      fontFace: FONT,
    });
  }
}

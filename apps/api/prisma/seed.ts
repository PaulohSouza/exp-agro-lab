import { PrismaClient } from "@prisma/client";
import { gerarCroqui, calcularAreaUtilColhida, calcularProdutividadeKgHa } from "@exp/domain";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const hash = (s: string) => bcrypt.hashSync(s, 10);

async function main() {
  console.log("Seed: cenário PC1699 (Tidil Desfolhante)…");

  // limpeza idempotente mínima
  await prisma.emailLog.deleteMany();
  await prisma.ordemServico.deleteMany(); // cascata: aprovações interna/cliente
  await prisma.experimentoResponsavel.deleteMany();
  await prisma.avaliacaoDado.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.parcela.deleteMany();
  await prisma.tratamentoProduto.deleteMany();
  await prisma.timing.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.atividade.deleteMany();
  await prisma.tratamento.deleteMany();
  await prisma.nivelFator.deleteMany();
  await prisma.fator.deleteMany();
  await prisma.experimento.deleteMany(); // cascata: atividades do experimento + apontamentos
  // catálogo (cascatas: prereqs de avaliação/atividade, itens de grupo, campos) — antes da instituição
  await prisma.grupoColeta.deleteMany();
  await prisma.modeloAvaliacao.deleteMany();
  await prisma.modeloAtividade.deleteMany();
  await prisma.aprovadorInstituicao.deleteMany();
  await prisma.user.deleteMany();
  await prisma.unidade.deleteMany();
  await prisma.departamento.deleteMany();
  await prisma.instituicao.deleteMany();
  await prisma.objetoEstudo.deleteMany();
  await prisma.subcategoria.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.local.deleteMany();
  await prisma.safra.deleteMany();
  await prisma.areaPesquisa.deleteMany();
  await prisma.delineamento.deleteMany();

  const inst = await prisma.instituicao.create({ data: { nome: "Instituição Demo" } });
  const unidade = await prisma.unidade.create({
    data: { instituicaoId: inst.id, nome: "CAD Primavera", tipo: "unidade" },
  });
  const admin = await prisma.user.create({
    data: {
      instituicaoId: inst.id,
      unidadeId: unidade.id,
      nome: "Admin Demo",
      email: "admin@demo.com",
      senhaHash: hash("admin123"),
      papel: "gestao_instituicao",
      isAdminInstituicao: true,
    },
  });
  // segundo usuário da mesma instituição (para testar compartilhamento)
  await prisma.user.create({
    data: {
      instituicaoId: inst.id,
      unidadeId: unidade.id,
      nome: "Analista Demo",
      email: "analista@demo.com",
      senhaHash: hash("analista123"),
      papel: "analista",
      isAdminInstituicao: false,
    },
  });
  // super-admin GLOBAL (cross-institution) — opera o SaaS. Tem instituição "casa"
  // mas o escopo ignora o tenant (RN-RBAC).
  await prisma.user.create({
    data: {
      instituicaoId: inst.id,
      nome: "Root Sistema",
      email: "root@sistema.com",
      senhaHash: hash("root123"),
      papel: "admin_sistema",
      isAdminInstituicao: true,
    },
  });

  const catCultura = await prisma.categoria.create({ data: { nome: "Cultura", eCultura: true } });
  const subAlgodao = await prisma.subcategoria.create({
    data: { categoriaId: catCultura.id, nome: "Algodão" },
  });
  const objFM944 = await prisma.objetoEstudo.create({
    data: { subcategoriaId: subAlgodao.id, nome: "FM 944 GL" },
  });

  const local = await prisma.local.create({ data: { nome: "CAD Primavera" } });
  const safra = await prisma.safra.create({ data: { nome: "25/26" } });
  const area = await prisma.areaPesquisa.create({ data: { nome: "Matologia" } });
  const dbc = await prisma.delineamento.create({ data: { nome: "DBC" } });

  const exp = await prisma.experimento.create({
    data: {
      codigo: "PC1699",
      titulo: "Tidil Desfolhante",
      objetivo:
        "Avaliar a eficácia de Thiadizuron 480SC isolado e em mistura com diuron na desfolha do algodão",
      ensaio: "interno",
      status: "Inserindo",
      instituicaoId: inst.id,
      unidadeId: unidade.id,
      ownerId: admin.id,
      objetoEstudoId: objFM944.id,
      localId: local.id,
      safraId: safra.id,
      areaPesquisaId: area.id,
      delineamentoId: dbc.id,
      cultivar: "FM 944 GL",
      tipoExecucao: "Plataforma",
      parcelaLarguraM: 4.05,
      parcelaComprimentoM: 7,
      parcelaNumLinhas: 9,
      espacamentoLinhasM: 0.45,
      numRepeticoes: 4,
      numTratamentos: 5,
      totalParcelas: 20,
    },
  });

  // Fator 1 com 5 níveis → 5 tratamentos
  const fator = await prisma.fator.create({
    data: { experimentoId: exp.id, ordem: 1, nome: "Produto", tipo: "qualitativo" },
  });
  const niveis = ["Testemunha", "Punto", "Agefix", "TIDIL/WakeUp", "Mistura"];
  for (const v of niveis) {
    await prisma.nivelFator.create({ data: { fatorId: fator.id, valor: v } });
  }

  const tratamentos = [];
  for (let i = 0; i < 5; i++) {
    const t = await prisma.tratamento.create({
      data: { experimentoId: exp.id, numeroRef: i + 1, tag: `T${i + 1}`, nome: niveis[i] },
    });
    tratamentos.push({ id: t.id, numeroRef: t.numeroRef });
  }

  // Produtos, atividade e timing + vínculo nos tratamentos (aba Tratamentos do print)
  const punto = await prisma.produto.create({ data: { nome: "Punto" } });
  const agefix = await prisma.produto.create({ data: { nome: "Agefix" } });
  const tidil = await prisma.produto.create({ data: { nome: "TIDIL/WakeUp" } });
  const atividade = await prisma.atividade.create({
    data: { nome: "Aplicação Produtos Líquidos em Parcelas de forma Manual" },
  });
  const timing1 = await prisma.timing.create({
    data: { experimentoId: exp.id, nome: "1ª Aplicação", ordem: 1 },
  });
  const vinc: Array<[number, string, number, string]> = [
    [2, punto.id, 0.17, "ml/ha"], // T2 Punto
    [3, agefix.id, 0.3, "l/ha"], // T3 Agefix
    [4, tidil.id, 0.23, "ml/ha"], // T4 Tidil/WakeUp
  ];
  for (const [tn, produtoId, dose, unidade] of vinc) {
    const t = tratamentos.find((x) => x.numeroRef === tn)!;
    await prisma.tratamentoProduto.create({
      data: {
        tratamentoId: t.id,
        seq: 1,
        produtoId,
        modoAplicacao: "Pulverização",
        dose,
        unidadeDose: unidade,
        volumeCaldaLha: 120,
        timingId: timing1.id,
        atividadeId: atividade.id,
      },
    });
  }

  // Croqui DBC 5×4 (20 parcelas) — núcleo de domínio
  const croqui = gerarCroqui("DBC", tratamentos, 4, { seed: 42, numeroInicial: 43958 });
  for (const p of croqui.parcelas) {
    await prisma.parcela.create({
      data: {
        experimentoId: exp.id,
        tratamentoId: p.tratamentoId,
        bloco: p.bloco,
        numero: p.numero,
        posLinha: p.posLinha,
        posColuna: p.posColuna,
        isInicio: p.isInicio,
      },
    });
  }

  // Avaliação de produtividade (RN-PROD)
  const aval = await prisma.avaliacao.create({
    data: {
      experimentoId: exp.id,
      nome: "Produtividade",
      unidadeColeta: "kg/parcela",
      unidadeSaida: "kg/ha",
      formula: "(valor / areaUtil) * 10000",
      tipo: "condicional",
      timingId: timing1.id,
      ordem: 1,
    },
  });

  // ATIVIDADE de colheita: valor bruto + apontamentos em TODAS as parcelas
  // (dados plausíveis e determinísticos p/ testar input → análise → relatório).
  const todasParcelas = await prisma.parcela.findMany({
    where: { experimentoId: exp.id },
    include: { tratamento: true },
  });
  const areaUtilM2 = calcularAreaUtilColhida({
    numLinhasColhidas: 4,
    espacamentoLinhasM: exp.espacamentoLinhasM ?? 0.45,
    comprimentoColhidoM: 5,
  });

  // Colheita = atividade (apontamento) que fornece a área útil (RN-PROD / C5).
  const modeloColheita = await prisma.modeloAtividade.create({
    data: {
      nome: "Colheita",
      escopo: "sistema",
      tipo: "apontamento",
      fornecAreaColheita: true,
      descricao: "Registra nº de linhas e comprimento colhidos (define a área útil).",
      campos: {
        create: [
          { rotulo: "linhas", tipo: "numero", obrigatorio: true, ordem: 0 },
          { rotulo: "comprimento", tipo: "numero", unidade: "m", obrigatorio: true, ordem: 1 },
        ],
      },
    },
  });
  await prisma.atividadeExperimento.create({
    data: {
      experimentoId: exp.id,
      modeloId: modeloColheita.id,
      nome: "Colheita",
      marco: "colheita",
      tipo: "apontamento",
      ordem: 1,
      valores: {
        create: [
          { rotulo: "linhas", valorNum: 4 },
          { rotulo: "comprimento", valorNum: 5 },
        ],
      },
    },
  });

  // Catálogo de avaliações demo (sistema): Umidade e Produtividade (exige Umidade + atividade Colheita).
  const mUmidade = await prisma.modeloAvaliacao.create({
    data: {
      nome: "Umidade",
      escopo: "sistema",
      unidadeColeta: "%",
      unidadeSaida: "%",
      numeroPontos: 1,
      descricaoColeta: "Umidade dos grãos (para correção a 13%).",
    },
  });
  const mProd = await prisma.modeloAvaliacao.create({
    data: {
      nome: "Produtividade",
      escopo: "sistema",
      unidadeColeta: "kg",
      unidadeSaida: "sacas/ha",
      calculoRelatorio: "(valor / areaUtil) * 10000",
      numeroPontos: 1,
      descricaoColeta: "Massa colhida por parcela; área útil vem da atividade Colheita.",
      prerequisitos: { create: [{ prerequisitoId: mUmidade.id }] },
      prerequisitosAtividade: { create: [{ modeloAtividadeId: modeloColheita.id }] },
    },
  });
  // Grupo de coleta demo (Macro B): conjunto coletado junto na colheita.
  await prisma.grupoColeta.create({
    data: {
      nome: "Colheita (Umidade + Produtividade)",
      escopo: "sistema",
      descricao: "Avaliações coletadas juntas no momento da colheita.",
      itens: {
        create: [
          { modeloId: mUmidade.id, ordem: 0 },
          { modeloId: mProd.id, ordem: 1 },
        ],
      },
    },
  });

  const baseKg = [7.0, 8.6, 8.0, 9.6, 8.2]; // por tratamento (T1..T5), kg/parcela
  for (const p of todasParcelas) {
    const base = baseKg[(p.tratamento!.numeroRef - 1) % baseKg.length];
    const efeitoBloco = (p.bloco - 2.5) * 0.18;
    const wiggle = ((p.numero % 5) - 2) * 0.06;
    const valor = Math.round((base + efeitoBloco + wiggle) * 100) / 100;
    await prisma.avaliacaoDado.create({
      data: { avaliacaoId: aval.id, parcelaId: p.id, valorColetado: valor, origem: "web" },
    });
  }
  const exemplo = calcularProdutividadeKgHa({ valorKgParcela: baseKg[3], areaUtilM2 });
  console.log(
    `  produtividade lançada em ${todasParcelas.length} parcelas (ex.: T4 ${baseKg[3]} kg → ${exemplo.toFixed(0)} kg/ha)`,
  );

  // Experimento "sandbox" vazio (lab-style) — usado pelos testes e2e e para demo de período/atividades.
  await prisma.experimento.create({
    data: {
      titulo: "SIM 2-Fatores — Cultivar x Dose (desfolha)",
      ensaio: "interno",
      espacamentoLinhasM: 0.45,
      numRepeticoes: 4,
      instituicaoId: inst.id,
      ownerId: admin.id,
    },
  });

  const nParcelas = await prisma.parcela.count({ where: { experimentoId: exp.id } });
  console.log(
    `Seed concluído: experimento ${exp.codigo}, ${nParcelas} parcelas, croqui ${croqui.numLinhas}×${croqui.numColunas}.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

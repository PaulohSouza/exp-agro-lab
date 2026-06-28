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
  await prisma.experimento.deleteMany();
  await prisma.aprovadorInstituicao.deleteMany();
  await prisma.user.deleteMany();
  await prisma.unidade.deleteMany();
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
      isAdminInstituicao: false,
    },
  });

  const catCultura = await prisma.categoria.create({ data: { nome: "Cultura" } });
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

  // ATIVIDADE de colheita: valor bruto + apontamentos (linhas, comprimento, área útil).
  const parcelaInicio = await prisma.parcela.findFirst({
    where: { experimentoId: exp.id, isInicio: true },
  });
  if (parcelaInicio) {
    const areaUtilM2 = calcularAreaUtilColhida({
      numLinhasColhidas: 4,
      espacamentoLinhasM: exp.espacamentoLinhasM ?? 0.45,
      comprimentoColhidoM: 5,
    });
    await prisma.avaliacaoDado.create({
      data: {
        avaliacaoId: aval.id,
        parcelaId: parcelaInicio.id,
        valorColetado: 8.5, // kg/parcela (bruto)
        numLinhasColhidas: 4,
        comprimentoColhidoM: 5,
        areaUtilM2, // apontamento da atividade
        origem: "web",
      },
    });

    // PRODUTIVIDADE: apresentada apenas no relatório (não persistida na coleta).
    const kgha = calcularProdutividadeKgHa({ valorKgParcela: 8.5, areaUtilM2 });
    console.log(`  [relatório] 8,5 kg ÷ ${areaUtilM2} m² → ${kgha.toFixed(0)} kg/ha`);
  }

  const nParcelas = await prisma.parcela.count({ where: { experimentoId: exp.id } });
  console.log(`Seed concluído: experimento ${exp.codigo}, ${nParcelas} parcelas, croqui ${croqui.numLinhas}×${croqui.numColunas}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

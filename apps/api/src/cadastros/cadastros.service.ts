import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CadastrosService {
  constructor(private readonly prisma: PrismaService) {}

  listarProdutos() {
    return this.prisma.produto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
  }
  criarProduto(dto: { nome: string; marca?: string }) {
    return this.prisma.produto.create({ data: { nome: dto.nome, marca: dto.marca } });
  }

  listarAtividades() {
    return this.prisma.atividade.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
  }
  criarAtividade(dto: { nome: string; valorVenda?: number }) {
    return this.prisma.atividade.create({ data: { nome: dto.nome, valorVenda: dto.valorVenda } });
  }
}

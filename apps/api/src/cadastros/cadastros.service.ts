import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CadastrosService {
  constructor(private readonly prisma: PrismaService) {}

  // produtos / atividades
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

  // objeto de estudo genérico: categoria → subcategoria → objeto
  listarCategorias() {
    return this.prisma.categoria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
  }
  criarCategoria(dto: { nome: string }) {
    return this.prisma.categoria.create({ data: { nome: dto.nome } });
  }
  listarSubcategorias(categoriaId?: string) {
    return this.prisma.subcategoria.findMany({
      where: { ativo: true, ...(categoriaId ? { categoriaId } : {}) },
      orderBy: { nome: "asc" },
    });
  }
  criarSubcategoria(dto: { categoriaId: string; nome: string }) {
    return this.prisma.subcategoria.create({ data: { categoriaId: dto.categoriaId, nome: dto.nome } });
  }
  listarObjetos(subcategoriaId?: string) {
    return this.prisma.objetoEstudo.findMany({
      where: { ativo: true, ...(subcategoriaId ? { subcategoriaId } : {}) },
      orderBy: { nome: "asc" },
    });
  }
  criarObjeto(dto: { subcategoriaId: string; nome: string; obs?: string }) {
    return this.prisma.objetoEstudo.create({
      data: { subcategoriaId: dto.subcategoriaId, nome: dto.nome, obs: dto.obs },
    });
  }

  // cadastros simples
  listarLocais() {
    return this.prisma.local.findMany({ orderBy: { nome: "asc" } });
  }
  criarLocal(dto: { nome: string }) {
    return this.prisma.local.create({ data: { nome: dto.nome } });
  }
  listarSafras() {
    return this.prisma.safra.findMany({ orderBy: { nome: "desc" } });
  }
  criarSafra(dto: { nome: string }) {
    return this.prisma.safra.create({ data: { nome: dto.nome } });
  }
  listarAreas() {
    return this.prisma.areaPesquisa.findMany({ orderBy: { nome: "asc" } });
  }
  criarArea(dto: { nome: string }) {
    return this.prisma.areaPesquisa.create({ data: { nome: dto.nome } });
  }
  listarDelineamentos() {
    return this.prisma.delineamento.findMany({ orderBy: { nome: "asc" } });
  }
  criarDelineamento(dto: { nome: string }) {
    return this.prisma.delineamento.create({ data: { nome: dto.nome } });
  }
}

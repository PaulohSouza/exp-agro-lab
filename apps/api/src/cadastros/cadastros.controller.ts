import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CadastrosService } from "./cadastros.service";

@Controller("cadastros")
export class CadastrosController {
  constructor(private readonly service: CadastrosService) {}

  @Get("produtos") produtos() {
    return this.service.listarProdutos();
  }
  @Post("produtos") criarProduto(@Body() d: { nome: string; marca?: string }) {
    return this.service.criarProduto(d);
  }

  @Get("atividades") atividades() {
    return this.service.listarAtividades();
  }
  @Post("atividades") criarAtividade(@Body() d: { nome: string; valorVenda?: number }) {
    return this.service.criarAtividade(d);
  }

  @Get("categorias") categorias() {
    return this.service.listarCategorias();
  }
  @Post("categorias") criarCategoria(@Body() d: { nome: string; isCultura?: boolean }) {
    return this.service.criarCategoria(d);
  }
  @Put("categorias/:id") atualizarCategoria(
    @Param("id") id: string,
    @Body() d: { nome?: string; isCultura?: boolean },
  ) {
    return this.service.atualizarCategoria(id, d);
  }

  @Get("subcategorias") subcategorias(@Query("categoriaId") categoriaId?: string) {
    return this.service.listarSubcategorias(categoriaId);
  }
  @Post("subcategorias") criarSubcategoria(@Body() d: { categoriaId: string; nome: string }) {
    return this.service.criarSubcategoria(d);
  }

  @Get("objetos") objetos(@Query("subcategoriaId") subcategoriaId?: string) {
    return this.service.listarObjetos(subcategoriaId);
  }
  @Post("objetos") criarObjeto(@Body() d: { subcategoriaId: string; nome: string; observacoes?: string }) {
    return this.service.criarObjeto(d);
  }

  @Get("locais") locais() {
    return this.service.listarLocais();
  }
  @Post("locais") criarLocal(@Body() d: { nome: string }) {
    return this.service.criarLocal(d);
  }

  @Get("safras") safras() {
    return this.service.listarSafras();
  }
  @Post("safras") criarSafra(@Body() d: { nome: string }) {
    return this.service.criarSafra(d);
  }

  @Get("areas") areas() {
    return this.service.listarAreas();
  }
  @Post("areas") criarArea(@Body() d: { nome: string }) {
    return this.service.criarArea(d);
  }

  @Get("delineamentos") delineamentos() {
    return this.service.listarDelineamentos();
  }
  @Post("delineamentos") criarDelineamento(@Body() d: { nome: string }) {
    return this.service.criarDelineamento(d);
  }
}

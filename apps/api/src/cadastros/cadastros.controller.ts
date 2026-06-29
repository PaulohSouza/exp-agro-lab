import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CadastrosService } from "./cadastros.service";

const nomeSchema = z.object({ nome: z.string().min(1, "Nome obrigatório") });
const produtoSchema = z.object({ nome: z.string().min(1), marca: z.string().optional() });
const cadAtividadeSchema = z.object({ nome: z.string().min(1), valorVenda: z.number().optional() });
const categoriaSchema = z.object({ nome: z.string().min(1), isCultura: z.boolean().optional() });
const categoriaPartialSchema = z.object({
  nome: z.string().min(1).optional(),
  isCultura: z.boolean().optional(),
});
const subcategoriaSchema = z.object({ categoriaId: z.string(), nome: z.string().min(1) });
const objetoSchema = z.object({
  subcategoriaId: z.string(),
  nome: z.string().min(1),
  observacoes: z.string().optional(),
});

@Controller("cadastros")
export class CadastrosController {
  constructor(private readonly service: CadastrosService) {}

  @Get("produtos") produtos() {
    return this.service.listarProdutos();
  }
  @Post("produtos") criarProduto(
    @Body(new ZodValidationPipe(produtoSchema)) d: { nome: string; marca?: string },
  ) {
    return this.service.criarProduto(d);
  }

  @Get("atividades") atividades() {
    return this.service.listarAtividades();
  }
  @Post("atividades") criarAtividade(
    @Body(new ZodValidationPipe(cadAtividadeSchema)) d: { nome: string; valorVenda?: number },
  ) {
    return this.service.criarAtividade(d);
  }

  @Get("categorias") categorias() {
    return this.service.listarCategorias();
  }
  @Post("categorias") criarCategoria(
    @Body(new ZodValidationPipe(categoriaSchema)) d: { nome: string; isCultura?: boolean },
  ) {
    return this.service.criarCategoria(d);
  }
  @Put("categorias/:id") atualizarCategoria(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(categoriaPartialSchema)) d: { nome?: string; isCultura?: boolean },
  ) {
    return this.service.atualizarCategoria(id, d);
  }

  @Get("subcategorias") subcategorias(@Query("categoriaId") categoriaId?: string) {
    return this.service.listarSubcategorias(categoriaId);
  }
  @Post("subcategorias") criarSubcategoria(
    @Body(new ZodValidationPipe(subcategoriaSchema)) d: { categoriaId: string; nome: string },
  ) {
    return this.service.criarSubcategoria(d);
  }

  @Get("objetos") objetos(@Query("subcategoriaId") subcategoriaId?: string) {
    return this.service.listarObjetos(subcategoriaId);
  }
  @Post("objetos") criarObjeto(
    @Body(new ZodValidationPipe(objetoSchema))
    d: {
      subcategoriaId: string;
      nome: string;
      observacoes?: string;
    },
  ) {
    return this.service.criarObjeto(d);
  }

  @Get("locais") locais() {
    return this.service.listarLocais();
  }
  @Post("locais") criarLocal(@Body(new ZodValidationPipe(nomeSchema)) d: { nome: string }) {
    return this.service.criarLocal(d);
  }

  @Get("safras") safras() {
    return this.service.listarSafras();
  }
  @Post("safras") criarSafra(@Body(new ZodValidationPipe(nomeSchema)) d: { nome: string }) {
    return this.service.criarSafra(d);
  }

  @Get("areas") areas() {
    return this.service.listarAreas();
  }
  @Post("areas") criarArea(@Body(new ZodValidationPipe(nomeSchema)) d: { nome: string }) {
    return this.service.criarArea(d);
  }

  @Get("delineamentos") delineamentos() {
    return this.service.listarDelineamentos();
  }
  @Post("delineamentos") criarDelineamento(
    @Body(new ZodValidationPipe(nomeSchema)) d: { nome: string },
  ) {
    return this.service.criarDelineamento(d);
  }
}

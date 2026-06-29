import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { TratamentosService, type ProdutoLinhaDto } from "./tratamentos.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const tratamentoSchema = z.object({
  nome: z.string().optional(),
  descricao: z.string().optional(),
});
const produtoLinhaSchema = z.object({
  produtoId: z.string(),
  sequencia: z.number().int().optional(),
  modoAplicacao: z.string().optional(),
  dose: z.number().optional(),
  unidadeDose: z.string().optional(),
  volumeCaldaLha: z.number().optional(),
  referencia: z.string().optional(),
  timingId: z.string().optional(),
  atividadeId: z.string().optional(),
  descricao: z.string().optional(),
});
const produtoLinhaPartialSchema = produtoLinhaSchema.partial();
const timingSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  ordem: z.number().int().optional(),
});

@Controller()
export class TratamentosController {
  constructor(private readonly service: TratamentosService) {}

  @Put("tratamentos/:id")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(tratamentoSchema)) dto: { nome?: string; descricao?: string },
  ) {
    return this.service.atualizar(id, user, dto);
  }

  @Post("tratamentos/:id/produtos")
  adicionarProduto(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(produtoLinhaSchema)) dto: ProdutoLinhaDto,
  ) {
    return this.service.adicionarProduto(id, user, dto);
  }

  @Put("tratamento-produtos/:id")
  atualizarProduto(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(produtoLinhaPartialSchema)) dto: Partial<ProdutoLinhaDto>,
  ) {
    return this.service.atualizarProduto(id, user, dto);
  }

  @Delete("tratamento-produtos/:id")
  removerProduto(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.removerProduto(id, user);
  }

  @Get("experimentos/:id/timings")
  listarTimings(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listarTimings(id, user);
  }

  @Post("experimentos/:id/timings")
  criarTiming(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(timingSchema)) dto: { nome: string; ordem?: number },
  ) {
    return this.service.criarTiming(id, user, dto);
  }
}

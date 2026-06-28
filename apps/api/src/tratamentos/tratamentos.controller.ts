import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { TratamentosService, type ProdutoLinhaDto } from "./tratamentos.service";

@Controller()
export class TratamentosController {
  constructor(private readonly service: TratamentosService) {}

  @Put("tratamentos/:id")
  atualizar(@Param("id") id: string, @Body() dto: { nome?: string; descricao?: string }) {
    return this.service.atualizar(id, dto);
  }

  @Post("tratamentos/:id/produtos")
  adicionarProduto(@Param("id") id: string, @Body() dto: ProdutoLinhaDto) {
    return this.service.adicionarProduto(id, dto);
  }

  @Put("tratamento-produtos/:id")
  atualizarProduto(@Param("id") id: string, @Body() dto: Partial<ProdutoLinhaDto>) {
    return this.service.atualizarProduto(id, dto);
  }

  @Delete("tratamento-produtos/:id")
  removerProduto(@Param("id") id: string) {
    return this.service.removerProduto(id);
  }

  @Get("experimentos/:id/timings")
  listarTimings(@Param("id") id: string) {
    return this.service.listarTimings(id);
  }

  @Post("experimentos/:id/timings")
  criarTiming(@Param("id") id: string, @Body() dto: { nome: string; ordem?: number }) {
    return this.service.criarTiming(id, dto);
  }
}

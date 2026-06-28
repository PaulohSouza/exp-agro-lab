import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import {
  AvaliacoesService,
  type CriarAvaliacaoDto,
  type LancarDadoDto,
} from "./avaliacoes.service";

@Controller()
export class AvaliacoesController {
  constructor(private readonly service: AvaliacoesService) {}

  @Get("experimentos/:id/avaliacoes")
  listar(@Param("id") id: string) {
    return this.service.listar(id);
  }

  @Post("experimentos/:id/avaliacoes")
  criar(@Param("id") id: string, @Body() dto: CriarAvaliacaoDto) {
    return this.service.criar(id, dto);
  }

  @Put("avaliacoes/:id")
  atualizar(@Param("id") id: string, @Body() dto: Partial<CriarAvaliacaoDto>) {
    return this.service.atualizar(id, dto);
  }

  @Delete("avaliacoes/:id")
  remover(@Param("id") id: string) {
    return this.service.remover(id);
  }

  @Get("avaliacoes/:id/dados")
  listarDados(@Param("id") id: string) {
    return this.service.listarDados(id);
  }

  @Post("avaliacoes/:id/dados")
  lancar(@Param("id") id: string, @Body() body: { dados: LancarDadoDto[] }) {
    return this.service.lancar(id, body.dados);
  }

  @Get("avaliacoes/:id/relatorio")
  relatorio(@Param("id") id: string) {
    return this.service.relatorio(id);
  }
}

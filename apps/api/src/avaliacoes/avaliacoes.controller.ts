import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import {
  AvaliacoesService,
  type CriarAvaliacaoDto,
  type LancarDadoDto,
} from "./avaliacoes.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller()
export class AvaliacoesController {
  constructor(private readonly service: AvaliacoesService) {}

  @Get("experimentos/:id/avaliacoes")
  listar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listar(id, user);
  }

  @Post("experimentos/:id/avaliacoes")
  criar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string, @Body() dto: CriarAvaliacaoDto) {
    return this.service.criar(id, user, dto);
  }

  @Put("avaliacoes/:id")
  atualizar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string, @Body() dto: Partial<CriarAvaliacaoDto>) {
    return this.service.atualizar(id, user, dto);
  }

  @Delete("avaliacoes/:id")
  remover(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.remover(id, user);
  }

  @Get("avaliacoes/:id/dados")
  listarDados(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listarDados(id, user);
  }

  @Post("avaliacoes/:id/dados")
  lancar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string, @Body() body: { dados: LancarDadoDto[] }) {
    return this.service.lancar(id, user, body.dados);
  }

  @Get("avaliacoes/:id/relatorio")
  relatorio(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.relatorio(id, user);
  }
}

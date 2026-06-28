import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { InstituicaoService } from "./instituicao.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller("instituicao")
export class InstituicaoController {
  constructor(private readonly service: InstituicaoService) {}

  @Get()
  obter(@CurrentUser() user: UsuarioAtual) {
    return this.service.obter(user);
  }

  @Put()
  atualizar(@CurrentUser() user: UsuarioAtual, @Body() dto: { politicaAprovacao?: "todos" | "n_de_m"; nAprovadores?: number }) {
    return this.service.atualizar(user, dto);
  }

  @Get("aprovadores")
  listarAprovadores(@CurrentUser() user: UsuarioAtual) {
    return this.service.listarAprovadores(user);
  }

  @Post("aprovadores")
  adicionarAprovador(@CurrentUser() user: UsuarioAtual, @Body() dto: { userId: string }) {
    return this.service.adicionarAprovador(user, dto);
  }

  @Delete("aprovadores/:id")
  removerAprovador(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.removerAprovador(user, id);
  }
}

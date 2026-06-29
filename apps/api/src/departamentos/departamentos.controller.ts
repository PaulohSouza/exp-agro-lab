import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { DepartamentosService } from "./departamentos.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { RequirePapel } from "../auth/papel.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller("departamentos")
export class DepartamentosController {
  constructor(private readonly service: DepartamentosService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioAtual) {
    return this.service.listar(user);
  }

  @Get("unidades")
  listarUnidades(@CurrentUser() user: UsuarioAtual) {
    return this.service.listarUnidades(user);
  }

  @Post()
  @RequirePapel("GESTAO_INSTITUICAO")
  criar(@CurrentUser() user: UsuarioAtual, @Body() dto: { nome: string }) {
    return this.service.criar(user, dto);
  }

  @Put(":id")
  @RequirePapel("GESTAO_INSTITUICAO")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() dto: { nome?: string; isAtivo?: boolean },
  ) {
    return this.service.atualizar(user, id, dto);
  }

  @Delete(":id")
  @RequirePapel("GESTAO_INSTITUICAO")
  desativar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.desativar(user, id);
  }
}

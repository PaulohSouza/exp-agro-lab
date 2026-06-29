import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import type { Papel } from "@prisma/client";
import { UsuariosService } from "./usuarios.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { RequirePapel } from "../auth/papel.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioAtual) {
    return this.service.listar(user);
  }

  @Post()
  @RequirePapel("gestao_instituicao")
  criar(
    @CurrentUser() user: UsuarioAtual,
    @Body()
    dto: {
      nome: string;
      email: string;
      senha: string;
      papel?: Papel;
      isAdminInstituicao?: boolean;
      unidadeId?: string;
    },
  ) {
    return this.service.criar(user, dto);
  }

  @Put(":id")
  @RequirePapel("gestao_instituicao")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body()
    dto: {
      papel?: Papel;
      departamentoId?: string | null;
      unidadeId?: string | null;
      ativo?: boolean;
    },
  ) {
    return this.service.atualizar(user, id, dto);
  }
}

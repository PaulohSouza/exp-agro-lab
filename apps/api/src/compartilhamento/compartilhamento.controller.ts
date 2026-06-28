import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CompartilhamentoService } from "./compartilhamento.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller()
export class CompartilhamentoController {
  constructor(private readonly service: CompartilhamentoService) {}

  @Get("experimentos/:id/compartilhamentos")
  listar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listar(id, user);
  }

  @Post("experimentos/:id/compartilhar")
  compartilhar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() dto: { email: string; nivel: "input" | "edit" },
  ) {
    return this.service.compartilhar(id, user, dto);
  }

  @Delete("compartilhamentos/:id")
  revogar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.revogar(id, user);
  }
}

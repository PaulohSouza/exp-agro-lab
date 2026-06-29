import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { InstituicaoService } from "./instituicao.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const atualizarInstituicaoSchema = z.object({
  politicaAprovacao: z.enum(["TODOS", "N_DE_M"]).optional(),
  numeroAprovadores: z.number().int().positive().optional(),
});
const aprovadorSchema = z.object({ userId: z.string().min(1) });

@Controller("INSTITUICAO")
export class InstituicaoController {
  constructor(private readonly service: InstituicaoService) {}

  @Get()
  obter(@CurrentUser() user: UsuarioAtual) {
    return this.service.obter(user);
  }

  @Put()
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Body(new ZodValidationPipe(atualizarInstituicaoSchema))
    dto: { politicaAprovacao?: "TODOS" | "N_DE_M"; numeroAprovadores?: number },
  ) {
    return this.service.atualizar(user, dto);
  }

  @Get("aprovadores")
  listarAprovadores(@CurrentUser() user: UsuarioAtual) {
    return this.service.listarAprovadores(user);
  }

  @Post("aprovadores")
  adicionarAprovador(
    @CurrentUser() user: UsuarioAtual,
    @Body(new ZodValidationPipe(aprovadorSchema)) dto: { userId: string },
  ) {
    return this.service.adicionarAprovador(user, dto);
  }

  @Delete("aprovadores/:id")
  removerAprovador(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.removerAprovador(user, id);
  }
}

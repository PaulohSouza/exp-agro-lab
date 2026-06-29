import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { GruposColetaService } from "./grupos-coleta.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";
import type { EscopoModelo } from "@exp/domain";

const grupoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricao: z.string().optional(),
  escopo: z.enum(["SISTEMA", "INSTITUICAO", "DEPARTAMENTO"]),
  departamentoId: z.string().optional(),
  modeloIds: z.array(z.string()).optional(),
});
const grupoPartialSchema = grupoSchema.partial();

interface GrupoBody {
  nome: string;
  descricao?: string;
  escopo: EscopoModelo;
  departamentoId?: string;
  modeloIds?: string[];
}

@Controller("grupos-coleta")
export class GruposColetaController {
  constructor(private readonly service: GruposColetaService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioAtual) {
    return this.service.listar(user);
  }

  @Post()
  criar(
    @CurrentUser() user: UsuarioAtual,
    @Body(new ZodValidationPipe(grupoSchema)) dto: GrupoBody,
  ) {
    return this.service.criar(user, dto);
  }

  @Put(":id")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(grupoPartialSchema)) dto: Partial<GrupoBody>,
  ) {
    return this.service.atualizar(user, id, dto);
  }

  @Delete(":id")
  remover(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.remover(user, id);
  }
}

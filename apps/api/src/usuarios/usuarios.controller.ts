import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import type { Papel } from "@prisma/client";
import { UsuariosService } from "./usuarios.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { RequirePapel } from "../auth/papel.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const criarUsuarioSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  papel: z
    .enum([
      "ADMIN_SISTEMA",
      "GESTAO_INSTITUICAO",
      "GESTAO_DEPARTAMENTO",
      "COORDENADOR_AREA",
      "PESQUISADOR",
      "ANALISTA",
      "ASSISTENTE",
    ])
    .optional(),
  isAdminInstituicao: z.boolean().optional(),
  unidadeId: z.string().optional(),
});
const atualizarUsuarioSchema = z.object({
  papel: z
    .enum([
      "ADMIN_SISTEMA",
      "GESTAO_INSTITUICAO",
      "GESTAO_DEPARTAMENTO",
      "COORDENADOR_AREA",
      "PESQUISADOR",
      "ANALISTA",
      "ASSISTENTE",
    ])
    .optional(),
  departamentoId: z.string().nullable().optional(),
  unidadeId: z.string().nullable().optional(),
  isAtivo: z.boolean().optional(),
});

@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioAtual) {
    return this.service.listar(user);
  }

  @Post()
  @RequirePapel("GESTAO_INSTITUICAO")
  criar(
    @CurrentUser() user: UsuarioAtual,
    @Body(new ZodValidationPipe(criarUsuarioSchema))
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
  @RequirePapel("GESTAO_INSTITUICAO")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(atualizarUsuarioSchema))
    dto: {
      papel?: Papel;
      departamentoId?: string | null;
      unidadeId?: string | null;
      isAtivo?: boolean;
    },
  ) {
    return this.service.atualizar(user, id, dto);
  }
}

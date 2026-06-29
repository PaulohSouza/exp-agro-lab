import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ModeloAvaliacaoService } from "./modelo-avaliacao.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";
import type { EscopoModelo } from "@exp/domain";

const modeloSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricaoColeta: z.string().optional(),
  numeroPontos: z.number().int().optional(),
  metodologiaRelatorio: z.string().optional(),
  unidadeColeta: z.string().optional(),
  unidadeSaida: z.string().optional(),
  calculoRelatorio: z.string().optional(),
  escopo: z.enum(["SISTEMA", "INSTITUICAO", "DEPARTAMENTO"]),
  departamentoId: z.string().optional(),
  baseadoEmId: z.string().optional(),
  prerequisitoIds: z.array(z.string()).optional(),
  prerequisitoAtividadeIds: z.array(z.string()).optional(),
});
const modeloPartialSchema = modeloSchema.partial();

interface ModeloBody {
  nome: string;
  descricaoColeta?: string;
  numeroPontos?: number;
  metodologiaRelatorio?: string;
  unidadeColeta?: string;
  unidadeSaida?: string;
  calculoRelatorio?: string;
  escopo: EscopoModelo;
  departamentoId?: string;
  baseadoEmId?: string;
  prerequisitoIds?: string[];
  prerequisitoAtividadeIds?: string[];
}

@Controller("modelos-avaliacao")
export class ModeloAvaliacaoController {
  constructor(private readonly service: ModeloAvaliacaoService) {}

  // Leitura aberta a qualquer autenticado; a visibilidade é filtrada por escopo no service.
  @Get()
  listar(@CurrentUser() user: UsuarioAtual) {
    return this.service.listar(user);
  }

  // A capacidade de gerir por escopo é validada no service (podeGerenciarEscopo).
  @Post()
  criar(
    @CurrentUser() user: UsuarioAtual,
    @Body(new ZodValidationPipe(modeloSchema)) dto: ModeloBody,
  ) {
    return this.service.criar(user, dto);
  }

  @Put(":id")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(modeloPartialSchema)) dto: Partial<ModeloBody>,
  ) {
    return this.service.atualizar(user, id, dto);
  }

  @Delete(":id")
  remover(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.remover(user, id);
  }
}

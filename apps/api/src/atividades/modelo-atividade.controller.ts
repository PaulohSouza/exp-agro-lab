import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ModeloAtividadeService } from "./modelo-atividade.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";
import type { EscopoModelo, TipoAtividade, TipoCampo } from "@exp/domain";

const campoSchema = z.object({
  rotulo: z.string().min(1),
  tipo: z.enum(["NUMERO", "TEXTO", "DATA", "BOOLEANO"]),
  unidade: z.string().optional(),
  isObrigatorio: z.boolean().optional(),
  ordem: z.number().int().optional(),
});
const modeloAtividadeSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricao: z.string().optional(),
  tipo: z.enum(["ACAO", "APONTAMENTO"]),
  metodologiaRelatorio: z.string().optional(),
  escopo: z.enum(["SISTEMA", "INSTITUICAO", "DEPARTAMENTO"]),
  departamentoId: z.string().optional(),
  campos: z.array(campoSchema).optional(),
});
const modeloAtividadePartialSchema = modeloAtividadeSchema.partial();

interface CampoBody {
  rotulo: string;
  tipo?: TipoCampo;
  unidade?: string;
  isObrigatorio?: boolean;
  ordem?: number;
}
interface ModeloAtividadeBody {
  nome: string;
  descricao?: string;
  tipo: TipoAtividade;
  metodologiaRelatorio?: string;
  escopo: EscopoModelo;
  departamentoId?: string;
  campos?: CampoBody[];
}

@Controller("modelos-atividade")
export class ModeloAtividadeController {
  constructor(private readonly service: ModeloAtividadeService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioAtual) {
    return this.service.listar(user);
  }

  @Post()
  criar(
    @CurrentUser() user: UsuarioAtual,
    @Body(new ZodValidationPipe(modeloAtividadeSchema)) dto: ModeloAtividadeBody,
  ) {
    return this.service.criar(user, dto);
  }

  @Put(":id")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(modeloAtividadePartialSchema)) dto: Partial<ModeloAtividadeBody>,
  ) {
    return this.service.atualizar(user, id, dto);
  }

  @Delete(":id")
  remover(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.remover(user, id);
  }
}

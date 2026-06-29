import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ModeloAtividadeService } from "./modelo-atividade.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";
import type { EscopoModelo, TipoAtividade, TipoCampo } from "@exp/domain";

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
  criar(@CurrentUser() user: UsuarioAtual, @Body() dto: ModeloAtividadeBody) {
    return this.service.criar(user, dto);
  }

  @Put(":id")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() dto: Partial<ModeloAtividadeBody>,
  ) {
    return this.service.atualizar(user, id, dto);
  }

  @Delete(":id")
  remover(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.remover(user, id);
  }
}

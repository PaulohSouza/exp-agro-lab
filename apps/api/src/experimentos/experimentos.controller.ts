import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import {
  ExperimentosService,
  type CriarExperimentoDto,
  type AtualizarExperimentoDto,
  type DefinirFatoresDto,
} from "./experimentos.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller("experimentos")
export class ExperimentosController {
  constructor(private readonly service: ExperimentosService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioAtual) {
    return this.service.listar(user);
  }

  @Get(":id")
  obter(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.obter(id, user);
  }

  @Post()
  criar(@CurrentUser() user: UsuarioAtual, @Body() dto: CriarExperimentoDto) {
    return this.service.criar(user, dto);
  }

  @Put(":id")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() dto: AtualizarExperimentoDto,
  ) {
    return this.service.atualizar(id, user, dto);
  }

  @Post(":id/fatores")
  definirFatores(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() dto: DefinirFatoresDto,
  ) {
    return this.service.definirFatores(id, user, dto);
  }

  @Post(":id/croqui/gerar")
  gerarCroqui(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body()
    body: {
      delineamento?: "DIC" | "DBC" | "FATORIAL";
      blocos?: number;
      seed?: number;
      numeroInicial?: number;
    },
  ) {
    return this.service.gerarCroqui(id, user, body ?? {});
  }

  @Put(":id/croqui")
  salvarCroqui(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body()
    body: {
      parcelas: Array<{
        id: string;
        tratamentoId: string;
        bloco: number;
        posicaoLinha: number;
        posicaoColuna: number;
        numero: number;
        isInicio?: boolean;
      }>;
    },
  ) {
    return this.service.salvarCroqui(id, user, body.parcelas);
  }

  @Get(":id/responsaveis")
  listarResponsaveis(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listarResponsaveis(id, user);
  }

  @Post(":id/responsaveis")
  adicionarResponsavel(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() body: { userId: string },
  ) {
    return this.service.adicionarResponsavel(id, user, body.userId);
  }

  @Delete(":id/responsaveis/:userId")
  removerResponsavel(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.service.removerResponsavel(id, user, userId);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import {
  AvaliacoesService,
  type CriarAvaliacaoDto,
  type LancarDadoDto,
} from "./avaliacoes.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller()
export class AvaliacoesController {
  constructor(private readonly service: AvaliacoesService) {}

  @Get("experimentos/:id/avaliacoes")
  listar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listar(id, user);
  }

  @Post("experimentos/:id/avaliacoes")
  criar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() dto: CriarAvaliacaoDto,
  ) {
    return this.service.criar(id, user, dto);
  }

  @Post("experimentos/:id/avaliacoes/do-modelo")
  adicionarDoModelo(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() body: { modeloIds: string[] },
  ) {
    return this.service.adicionarDoModelo(id, user, body.modeloIds);
  }

  @Post("experimentos/:id/grupos/:grupoId/aplicar")
  aplicarGrupo(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Param("grupoId") grupoId: string,
  ) {
    return this.service.aplicarGrupo(id, user, grupoId);
  }

  @Post("experimentos/:id/coleta-lote")
  lancarLote(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body()
    body: {
      lancamentos: Array<{
        avaliacaoId: string;
        parcelaId: string;
        numAmostra?: number;
        valorColetado?: number | null;
      }>;
    },
  ) {
    return this.service.lancarLote(id, user, body.lancamentos ?? []);
  }

  @Put("avaliacoes/:id")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() dto: Partial<CriarAvaliacaoDto>,
  ) {
    return this.service.atualizar(id, user, dto);
  }

  @Delete("avaliacoes/:id")
  remover(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.remover(id, user);
  }

  @Get("avaliacoes/:id/dados")
  listarDados(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listarDados(id, user);
  }

  @Post("avaliacoes/:id/dados")
  lancar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() body: { dados: LancarDadoDto[] },
  ) {
    return this.service.lancar(id, user, body.dados);
  }

  @Get("avaliacoes/:id/relatorio")
  relatorio(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.relatorio(id, user);
  }

  @Get("avaliacoes/:id/analise")
  analise(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Query("metodo") metodo?: "LSD" | "Tukey" | "ScottKnott",
  ) {
    return this.service.analise(id, user, metodo);
  }
}

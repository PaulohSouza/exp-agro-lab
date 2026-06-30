import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import {
  AvaliacoesService,
  type CriarAvaliacaoDto,
  type LancarDadoDto,
} from "./avaliacoes.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const criarAvaliacaoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  metodologia: z.string().optional(),
  unidadeColeta: z.string().optional(),
  unidadeSaida: z.string().optional(),
  formula: z.string().optional(),
  tipo: z.enum(["CALENDARIZADA", "CONDICIONAL"]).optional(),
  isPersonalizada: z.boolean().optional(),
  escala: z.string().optional(),
  timingId: z.string().optional(),
  dataPrevista: z.string().optional(),
});
const atualizarAvaliacaoSchema = criarAvaliacaoSchema.partial();
const doModeloSchema = z.object({ modeloIds: z.array(z.string()) });
const lancarSchema = z.object({
  dados: z.array(
    z.object({
      parcelaId: z.string(),
      numeroAmostra: z.number().int().optional(),
      valorColetado: z.number().optional(),
      observacoes: z.string().optional(),
      origem: z.enum(["WEB", "MOBILE"]).optional(),
    }),
  ),
});
const coletaLoteSchema = z.object({
  lancamentos: z.array(
    z.object({
      avaliacaoId: z.string(),
      parcelaId: z.string(),
      numeroAmostra: z.number().int().optional(),
      valorColetado: z.number().nullable().optional(),
    }),
  ),
});
const conjuntaSchema = z.object({
  experimentoIds: z.array(z.string()).min(2),
  avaliacaoNome: z.string().min(1),
});

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
    @Body(new ZodValidationPipe(criarAvaliacaoSchema)) dto: CriarAvaliacaoDto,
  ) {
    return this.service.criar(id, user, dto);
  }

  @Post("experimentos/:id/avaliacoes/do-modelo")
  adicionarDoModelo(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(doModeloSchema)) body: { modeloIds: string[] },
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
    @Body(new ZodValidationPipe(coletaLoteSchema))
    body: {
      lancamentos: Array<{
        avaliacaoId: string;
        parcelaId: string;
        numeroAmostra?: number;
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
    @Body(new ZodValidationPipe(atualizarAvaliacaoSchema)) dto: Partial<CriarAvaliacaoDto>,
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
    @Body(new ZodValidationPipe(lancarSchema)) body: { dados: LancarDadoDto[] },
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
    @Query("transformacao") transformacao?: "nenhuma" | "raiz" | "log" | "boxcox",
    @Query("naoParametrico") naoParametrico?: string,
  ) {
    return this.service.analise(id, user, metodo, transformacao, naoParametrico === "true");
  }

  @Post("analise/conjunta")
  analiseConjunta(
    @CurrentUser() user: UsuarioAtual,
    @Body(new ZodValidationPipe(conjuntaSchema))
    body: { experimentoIds: string[]; avaliacaoNome: string },
  ) {
    return this.service.analiseConjunta(body.experimentoIds, body.avaliacaoNome, user);
  }
}

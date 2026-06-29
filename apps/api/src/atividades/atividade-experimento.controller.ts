import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { AtividadeExperimentoService } from "./atividade-experimento.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";
import type { ValorApontamento } from "@exp/domain";

const criarAtividadeSchema = z.object({
  modeloId: z.string().optional(),
  nome: z.string().optional(),
  tipo: z.enum(["ACAO", "APONTAMENTO"]).optional(),
  data: z.string().optional(),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
});
const atualizarAtividadeSchema = z.object({
  dataPrevista: z.string().nullable().optional(),
  isConfirmada: z.boolean().optional(),
  data: z.string().nullable().optional(),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
});
const apontamentoSchema = z.object({
  valores: z.array(
    z.object({
      rotulo: z.string(),
      valorNum: z.number().nullable().optional(),
      valorTexto: z.string().nullable().optional(),
      valorData: z.string().nullable().optional(),
      valorBool: z.boolean().nullable().optional(),
    }),
  ),
});

interface CriarAtividadeBody {
  modeloId?: string;
  nome?: string;
  tipo?: "ACAO" | "APONTAMENTO";
  data?: string;
  responsavel?: string;
  observacoes?: string;
}

@Controller()
export class AtividadeExperimentoController {
  constructor(private readonly service: AtividadeExperimentoService) {}

  @Get("experimentos/:id/atividades")
  listar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listar(id, user);
  }

  @Post("experimentos/:id/atividades")
  criar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(criarAtividadeSchema)) dto: CriarAtividadeBody,
  ) {
    return this.service.criar(id, user, dto);
  }

  @Post("experimentos/:id/marcos/gerar")
  gerarMarcos(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.gerarMarcos(id, user);
  }

  @Put("atividades/:id")
  atualizar(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(atualizarAtividadeSchema))
    dto: {
      dataPrevista?: string | null;
      isConfirmada?: boolean;
      data?: string | null;
      responsavel?: string;
      observacoes?: string;
    },
  ) {
    return this.service.atualizar(id, user, dto);
  }

  @Post("atividades/:id/apontamento")
  apontamento(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(apontamentoSchema)) body: { valores: ValorApontamento[] },
  ) {
    return this.service.registrarApontamento(id, user, body.valores ?? []);
  }

  @Delete("atividades/:id")
  remover(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.remover(id, user);
  }
}

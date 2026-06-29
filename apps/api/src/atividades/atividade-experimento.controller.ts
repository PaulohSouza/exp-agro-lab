import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { AtividadeExperimentoService } from "./atividade-experimento.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";
import type { ValorApontamento } from "@exp/domain";

interface CriarAtividadeBody {
  modeloId?: string;
  nome?: string;
  tipo?: "ACAO" | "APONTAMENTO";
  data?: string;
  responsavel?: string;
  obs?: string;
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
    @Body() dto: CriarAtividadeBody,
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
    @Body()
    dto: {
      dataPrevista?: string | null;
      isConfirmada?: boolean;
      data?: string | null;
      responsavel?: string;
      obs?: string;
    },
  ) {
    return this.service.atualizar(id, user, dto);
  }

  @Post("atividades/:id/apontamento")
  apontamento(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body() body: { valores: ValorApontamento[] },
  ) {
    return this.service.registrarApontamento(id, user, body.valores ?? []);
  }

  @Delete("atividades/:id")
  remover(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.remover(id, user);
  }
}

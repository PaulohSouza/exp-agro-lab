import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { OrdemServicoService } from "./ordem-servico.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { Public } from "../auth/public.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const submeterSchema = z.object({ clienteEmail: z.string().email("E-mail inválido") });
const decisaoSchema = z.object({
  decisao: z.enum(["APROVADO", "RECUSADO"]),
  motivo: z.string().optional(),
});

@Controller()
export class OrdemServicoController {
  constructor(private readonly service: OrdemServicoService) {}

  @Get("experimentos/:id/ordens-servico")
  listar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.listar(id, user);
  }

  @Post("experimentos/:id/ordens-servico")
  criar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.criar(id, user);
  }

  @Post("ordens-servico/:id/submeter")
  submeter(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(submeterSchema)) dto: { clienteEmail: string },
  ) {
    return this.service.submeter(id, user, dto);
  }

  @Post("ordens-servico/:id/aprovar-interno")
  aprovarInterno(
    @CurrentUser() user: UsuarioAtual,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(decisaoSchema))
    dto: { decisao: "APROVADO" | "RECUSADO"; motivo?: string },
  ) {
    return this.service.aprovarInterno(id, user, dto);
  }

  @Public()
  @Post("aprovacao-cliente/:token")
  decisaoCliente(
    @Param("token") token: string,
    @Body(new ZodValidationPipe(decisaoSchema))
    dto: { decisao: "APROVADO" | "RECUSADO"; motivo?: string },
    @Req() req: { ip?: string },
  ) {
    return this.service.decisaoCliente(token, { ...dto, ip: req.ip });
  }
}

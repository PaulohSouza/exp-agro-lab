import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SyncService, type ColetaPush } from "./sync.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

const pushSchema = z.object({
  coletas: z.array(
    z.object({
      avaliacaoId: z.string(),
      parcelaId: z.string(),
      numeroAmostra: z.number().int(),
      valorColetado: z.number().optional(),
      clientUpdatedAt: z.number(),
      observacoes: z.string().optional(),
      dispositivoId: z.string().optional(),
    }),
  ),
});

@Controller("sync")
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Get("experimentos/:id")
  pull(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.pull(id, user);
  }

  @Post("push")
  push(
    @CurrentUser() user: UsuarioAtual,
    @Body(new ZodValidationPipe(pushSchema)) body: { coletas: ColetaPush[] },
  ) {
    return this.service.push(user, body.coletas ?? []);
  }
}

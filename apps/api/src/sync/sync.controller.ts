import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SyncService, type ColetaPush } from "./sync.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller("sync")
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Get("experimentos/:id")
  pull(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    return this.service.pull(id, user);
  }

  @Post("push")
  push(@CurrentUser() user: UsuarioAtual, @Body() body: { coletas: ColetaPush[] }) {
    return this.service.push(user, body.coletas ?? []);
  }
}

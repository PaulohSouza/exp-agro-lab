import { Controller, Get } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  resumo(@CurrentUser() user: UsuarioAtual) {
    return this.service.resumo(user);
  }
}

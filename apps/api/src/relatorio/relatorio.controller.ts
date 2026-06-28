import { Controller, Get, Header, Param, StreamableFile } from "@nestjs/common";
import { RelatorioService } from "./relatorio.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller("experimentos")
export class RelatorioController {
  constructor(private readonly service: RelatorioService) {}

  @Get(":id/relatorio.pptx")
  @Header("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation")
  @Header("Content-Disposition", 'attachment; filename="relatorio.pptx"')
  async pptx(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    const buffer = await this.service.gerarPptx(id, user);
    return new StreamableFile(buffer);
  }
}

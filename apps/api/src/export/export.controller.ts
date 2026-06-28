import { Controller, Get, Header, Param, StreamableFile } from "@nestjs/common";
import { ExportService } from "./export.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { UsuarioAtual } from "../auth/jwt.strategy";

@Controller("experimentos")
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Get(":id/export.xlsx")
  @Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @Header("Content-Disposition", 'attachment; filename="experimento.xlsx"')
  async exportar(@CurrentUser() user: UsuarioAtual, @Param("id") id: string) {
    const buffer = await this.service.experimentoXlsx(id, user);
    return new StreamableFile(buffer);
  }
}

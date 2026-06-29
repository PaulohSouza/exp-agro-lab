import { Module } from "@nestjs/common";
import { GruposColetaController } from "./grupos-coleta.controller";
import { GruposColetaService } from "./grupos-coleta.service";

@Module({
  controllers: [GruposColetaController],
  providers: [GruposColetaService],
})
export class GruposColetaModule {}

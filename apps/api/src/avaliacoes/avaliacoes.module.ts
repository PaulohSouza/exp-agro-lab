import { Module } from "@nestjs/common";
import { AvaliacoesService } from "./avaliacoes.service";
import { AvaliacoesController } from "./avaliacoes.controller";

@Module({
  providers: [AvaliacoesService],
  controllers: [AvaliacoesController],
})
export class AvaliacoesModule {}

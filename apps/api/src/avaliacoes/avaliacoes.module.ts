import { Module } from "@nestjs/common";
import { AvaliacoesService } from "./avaliacoes.service";
import { AvaliacoesController } from "./avaliacoes.controller";
import { ExperimentosModule } from "../experimentos/experimentos.module";

@Module({
  imports: [ExperimentosModule],
  providers: [AvaliacoesService],
  controllers: [AvaliacoesController],
})
export class AvaliacoesModule {}

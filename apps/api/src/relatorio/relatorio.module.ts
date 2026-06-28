import { Module } from "@nestjs/common";
import { RelatorioService } from "./relatorio.service";
import { RelatorioController } from "./relatorio.controller";
import { ExperimentosModule } from "../experimentos/experimentos.module";
import { AvaliacoesModule } from "../avaliacoes/avaliacoes.module";

@Module({
  imports: [ExperimentosModule, AvaliacoesModule],
  providers: [RelatorioService],
  controllers: [RelatorioController],
})
export class RelatorioModule {}

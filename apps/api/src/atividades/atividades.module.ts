import { Module } from "@nestjs/common";
import { ExperimentosModule } from "../experimentos/experimentos.module";
import { ModeloAtividadeController } from "./modelo-atividade.controller";
import { ModeloAtividadeService } from "./modelo-atividade.service";
import { AtividadeExperimentoController } from "./atividade-experimento.controller";
import { AtividadeExperimentoService } from "./atividade-experimento.service";

@Module({
  imports: [ExperimentosModule],
  controllers: [ModeloAtividadeController, AtividadeExperimentoController],
  providers: [ModeloAtividadeService, AtividadeExperimentoService],
})
export class AtividadesModule {}

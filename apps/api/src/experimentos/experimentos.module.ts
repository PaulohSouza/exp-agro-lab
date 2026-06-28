import { Module } from "@nestjs/common";
import { ExperimentosService } from "./experimentos.service";
import { ExperimentosController } from "./experimentos.controller";

@Module({
  providers: [ExperimentosService],
  controllers: [ExperimentosController],
  exports: [ExperimentosService],
})
export class ExperimentosModule {}

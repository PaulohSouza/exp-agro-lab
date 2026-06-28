import { Module } from "@nestjs/common";
import { TratamentosService } from "./tratamentos.service";
import { TratamentosController } from "./tratamentos.controller";
import { ExperimentosModule } from "../experimentos/experimentos.module";

@Module({
  imports: [ExperimentosModule],
  providers: [TratamentosService],
  controllers: [TratamentosController],
})
export class TratamentosModule {}

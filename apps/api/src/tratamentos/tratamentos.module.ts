import { Module } from "@nestjs/common";
import { TratamentosService } from "./tratamentos.service";
import { TratamentosController } from "./tratamentos.controller";

@Module({
  providers: [TratamentosService],
  controllers: [TratamentosController],
})
export class TratamentosModule {}

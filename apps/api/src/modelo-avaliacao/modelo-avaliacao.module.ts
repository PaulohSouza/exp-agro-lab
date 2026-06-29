import { Module } from "@nestjs/common";
import { ModeloAvaliacaoController } from "./modelo-avaliacao.controller";
import { ModeloAvaliacaoService } from "./modelo-avaliacao.service";

@Module({
  controllers: [ModeloAvaliacaoController],
  providers: [ModeloAvaliacaoService],
})
export class ModeloAvaliacaoModule {}

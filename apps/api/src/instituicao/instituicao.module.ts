import { Module } from "@nestjs/common";
import { InstituicaoService } from "./instituicao.service";
import { InstituicaoController } from "./instituicao.controller";

@Module({
  providers: [InstituicaoService],
  controllers: [InstituicaoController],
})
export class InstituicaoModule {}

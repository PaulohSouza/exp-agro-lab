import { Module } from "@nestjs/common";
import { CadastrosService } from "./cadastros.service";
import { CadastrosController } from "./cadastros.controller";

@Module({
  providers: [CadastrosService],
  controllers: [CadastrosController],
})
export class CadastrosModule {}

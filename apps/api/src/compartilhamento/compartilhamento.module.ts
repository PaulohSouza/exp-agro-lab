import { Module } from "@nestjs/common";
import { CompartilhamentoService } from "./compartilhamento.service";
import { CompartilhamentoController } from "./compartilhamento.controller";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [EmailModule],
  providers: [CompartilhamentoService],
  controllers: [CompartilhamentoController],
})
export class CompartilhamentoModule {}

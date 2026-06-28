import { Module } from "@nestjs/common";
import { OrdemServicoService } from "./ordem-servico.service";
import { OrdemServicoController } from "./ordem-servico.controller";
import { EmailModule } from "../email/email.module";
import { ExperimentosModule } from "../experimentos/experimentos.module";

@Module({
  imports: [EmailModule, ExperimentosModule],
  providers: [OrdemServicoService],
  controllers: [OrdemServicoController],
})
export class OrdemServicoModule {}

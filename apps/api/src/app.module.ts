import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { EmailModule } from "./email/email.module";
import { ExperimentosModule } from "./experimentos/experimentos.module";
import { CadastrosModule } from "./cadastros/cadastros.module";
import { TratamentosModule } from "./tratamentos/tratamentos.module";

@Module({
  imports: [PrismaModule, EmailModule, ExperimentosModule, CadastrosModule, TratamentosModule],
  controllers: [HealthController],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { EmailModule } from "./email/email.module";
import { ExperimentosModule } from "./experimentos/experimentos.module";
import { CadastrosModule } from "./cadastros/cadastros.module";
import { TratamentosModule } from "./tratamentos/tratamentos.module";
import { AvaliacoesModule } from "./avaliacoes/avaliacoes.module";

@Module({
  imports: [AuthModule, PrismaModule, EmailModule, ExperimentosModule, CadastrosModule, TratamentosModule, AvaliacoesModule],
  controllers: [HealthController],
})
export class AppModule {}

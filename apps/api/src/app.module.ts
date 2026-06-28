import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { EmailModule } from "./email/email.module";
import { ExperimentosModule } from "./experimentos/experimentos.module";
import { CadastrosModule } from "./cadastros/cadastros.module";
import { TratamentosModule } from "./tratamentos/tratamentos.module";
import { AvaliacoesModule } from "./avaliacoes/avaliacoes.module";
import { UsuariosModule } from "./usuarios/usuarios.module";
import { CompartilhamentoModule } from "./compartilhamento/compartilhamento.module";
import { InstituicaoModule } from "./instituicao/instituicao.module";
import { OrdemServicoModule } from "./ordem-servico/ordem-servico.module";

@Module({
  imports: [AuthModule, PrismaModule, EmailModule, ExperimentosModule, CadastrosModule, TratamentosModule, AvaliacoesModule, UsuariosModule, CompartilhamentoModule, InstituicaoModule, OrdemServicoModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}

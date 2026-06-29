import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { PapelGuard } from "./auth/papel.guard";
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
import { ExportModule } from "./export/export.module";
import { SyncModule } from "./sync/sync.module";
import { RelatorioModule } from "./relatorio/relatorio.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DepartamentosModule } from "./departamentos/departamentos.module";
import { ModeloAvaliacaoModule } from "./modelo-avaliacao/modelo-avaliacao.module";
import { AtividadesModule } from "./atividades/atividades.module";
import { GruposColetaModule } from "./grupos-coleta/grupos-coleta.module";
import { DominiosModule } from "./dominios/dominios.module";

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    EmailModule,
    ExperimentosModule,
    CadastrosModule,
    TratamentosModule,
    AvaliacoesModule,
    UsuariosModule,
    CompartilhamentoModule,
    InstituicaoModule,
    OrdemServicoModule,
    ExportModule,
    SyncModule,
    RelatorioModule,
    DashboardModule,
    DepartamentosModule,
    ModeloAvaliacaoModule,
    AtividadesModule,
    GruposColetaModule,
    DominiosModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PapelGuard },
  ],
})
export class AppModule {}

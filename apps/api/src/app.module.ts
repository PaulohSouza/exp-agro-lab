import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { EmailModule } from "./email/email.module";
import { ExperimentosModule } from "./experimentos/experimentos.module";

@Module({
  imports: [PrismaModule, EmailModule, ExperimentosModule],
  controllers: [HealthController],
})
export class AppModule {}

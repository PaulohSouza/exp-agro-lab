import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { EmailModule } from "./email/email.module";

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [HealthController],
})
export class AppModule {}

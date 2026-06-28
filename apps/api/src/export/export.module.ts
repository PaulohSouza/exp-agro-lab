import { Module } from "@nestjs/common";
import { ExportService } from "./export.service";
import { ExportController } from "./export.controller";
import { ExperimentosModule } from "../experimentos/experimentos.module";

@Module({
  imports: [ExperimentosModule],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}

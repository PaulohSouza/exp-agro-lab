import { Module } from "@nestjs/common";
import { SyncService } from "./sync.service";
import { SyncController } from "./sync.controller";
import { ExperimentosModule } from "../experimentos/experimentos.module";

@Module({
  imports: [ExperimentosModule],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}

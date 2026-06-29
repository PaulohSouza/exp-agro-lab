import { Module } from "@nestjs/common";
import { DominiosService } from "./dominios.service";
import { DominiosController } from "./dominios.controller";

@Module({
  providers: [DominiosService],
  controllers: [DominiosController],
})
export class DominiosModule {}

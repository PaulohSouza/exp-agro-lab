import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // expõe o x-request-id para o cliente conseguir ler/correlacionar.
  app.enableCors({ exposedHeaders: ["x-request-id"] });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`EXP-AGROLAB API ouvindo em http://localhost:${port}`, "Bootstrap");
}
bootstrap();

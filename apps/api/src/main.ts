import "reflect-metadata"
import "dotenv/config"

import { NestFactory } from "@nestjs/core"

import { AppModule } from "@/src/app.module"

import { ApiErrors } from "./errors"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()
  app.useGlobalFilters(new ApiErrors())
  await app.listen(process.env.PORT ?? 3002, "127.0.0.1")
}

void bootstrap()

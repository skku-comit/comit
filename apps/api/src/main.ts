import "reflect-metadata"
import "dotenv/config"

import { NestFactory } from "@nestjs/core"

import { AppModule } from "@/src/app.module"

import { setupBrowser } from "./browser"
import { ApiErrors } from "./errors"
import { setupSwagger } from "./swagger"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()
  setupBrowser(app)
  app.useGlobalFilters(new ApiErrors())
  setupSwagger(app)
  await app.listen(process.env.PORT ?? 3002, process.env.HOST ?? "127.0.0.1")
}

void bootstrap()

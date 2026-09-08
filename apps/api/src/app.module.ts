import { Module } from "@nestjs/common"

import { AppController } from "@/src/app.controller"

@Module({ controllers: [AppController] })
export class AppModule {}

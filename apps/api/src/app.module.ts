import { Module } from "@nestjs/common"

import { AppController } from "./app.controller"
import { DatabaseModule } from "./database"
import { MembershipsModule } from "./memberships"
import { SemestersModule } from "./semesters"
import { UsersModule } from "./users"

@Module({
  imports: [DatabaseModule, UsersModule, SemestersModule, MembershipsModule],
  controllers: [AppController],
})
export class AppModule {}

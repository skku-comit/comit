import { Module } from "@nestjs/common"

import { AppController } from "./app.controller"
import { AuthController } from "./auth-session"
import { DatabaseModule } from "./database"
import { MembershipsModule } from "./memberships"
import { SemestersModule } from "./semesters"
import { StudiesModule } from "./studies"
import { UsersModule } from "./users"

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    SemestersModule,
    MembershipsModule,
    StudiesModule,
  ],
  controllers: [AppController, AuthController],
})
export class AppModule {}

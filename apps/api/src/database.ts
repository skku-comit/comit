import { Global, Injectable, Module, OnModuleDestroy } from "@nestjs/common"
import { Prisma, PrismaClient } from "@prisma/client"

@Injectable()
export class Database extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect()
  }
  async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }
}

@Global()
@Module({ providers: [Database], exports: [Database] })
export class DatabaseModule {}

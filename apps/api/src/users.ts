import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import { Prisma } from "@prisma/client"

import { Actor, AuthGuard, Identity, requireAdmin } from "./auth"
import { Database } from "./database"
import { pagination, parse, profileSchema } from "./validation"

@Injectable()
export class UsersService {
  constructor(private readonly db: Database) {}
  async me(actor: Identity) {
    return {
      user: await this.db.user.findUnique({ where: { authId: actor.id } }),
      email: actor.email,
      isAdmin: actor.isAdmin,
    }
  }
  async list(actor: Identity, q: { page?: string; search?: string }) {
    requireAdmin(actor)
    const p = pagination(q)
    const where: Prisma.UserWhereInput = q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: "insensitive" } },
            { studentId: { contains: q.search } },
          ],
        }
      : {}
    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: p.skip,
        take: p.pageSize,
      }),
      this.db.user.count({ where }),
    ])
    return { ...p, items, total }
  }
  async save(actor: Identity, input: unknown, id?: string) {
    requireAdmin(actor)
    const profile = parse(profileSchema, input)
    return this.db.transaction(async (tx) => {
      const data = { ...profile, birthDate: new Date(profile.birthDate) }
      const user = id
        ? await tx.user.update({ where: { id }, data })
        : await tx.user.create({ data })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          entity: "User",
          entityId: user.id,
          action: id ? "UPDATE" : "CREATE",
          details: { studentId: user.studentId },
        },
      })
      return user
    })
  }
  async history(actor: Identity, id: string) {
    requireAdmin(actor)
    return this.db.membership.findMany({
      where: { userId: id },
      include: { semester: true },
      orderBy: { createdAt: "desc" },
    })
  }
}
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get("me") me(@Actor() a: Identity) {
    return this.service.me(a)
  }
  @Get() list(
    @Actor() a: Identity,
    @Query() q: { page?: string; search?: string }
  ) {
    return this.service.list(a, q)
  }
  @Post() create(@Actor() a: Identity, @Body() b: unknown) {
    return this.service.save(a, b)
  }
  @Patch(":id") update(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    return this.service.save(a, b, id)
  }
  @Get(":id/memberships") history(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.service.history(a, id)
  }
}

@Module({ controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}

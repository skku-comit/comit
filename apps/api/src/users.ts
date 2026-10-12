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
import { ApiTags } from "@nestjs/swagger"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { Actor, AuthGuard, Identity, requireAdmin } from "./auth"
import { Database } from "./database"
import { ApiEndpoint } from "./swagger"
import {
  membershipResponse,
  pageResponse,
  searchQuery,
  userResponse,
} from "./swagger.schemas"
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
@ApiTags("부원")
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @ApiEndpoint({
    summary: "내 계정 조회",
    auth: true,
    response: z.object({
      user: userResponse.nullable(),
      email: z.string(),
      isAdmin: z.boolean(),
    }),
  })
  @Get("me")
  me(@Actor() a: Identity) {
    return this.service.me(a)
  }
  @ApiEndpoint({
    summary: "부원 목록 조회",
    admin: true,
    query: searchQuery,
    response: pageResponse(userResponse, true),
  })
  @Get()
  list(@Actor() a: Identity, @Query() q: { page?: string; search?: string }) {
    return this.service.list(a, q)
  }
  @ApiEndpoint({
    summary: "부원 등록",
    admin: true,
    body: profileSchema,
    response: userResponse,
    status: 201,
    description:
      "생년월일은 YYYY-MM-DD 형식의 과거 또는 오늘 날짜입니다. 기타 학적은 academicOther가 필요합니다.",
  })
  @Post()
  create(@Actor() a: Identity, @Body() b: unknown) {
    return this.service.save(a, b)
  }
  @ApiEndpoint({
    summary: "부원 정보 수정",
    admin: true,
    params: ["id"],
    body: profileSchema,
    response: userResponse,
    description:
      "전체 프로필을 전달합니다. 기타 학적은 academicOther가 필요합니다.",
  })
  @Patch(":id")
  update(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    return this.service.save(a, b, id)
  }
  @ApiEndpoint({
    summary: "부원 학기별 가입 이력 조회",
    admin: true,
    params: ["id"],
    response: z.array(membershipResponse),
  })
  @Get(":id/memberships")
  history(@Actor() a: Identity, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.history(a, id)
  }
}

@Module({ controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}

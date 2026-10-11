import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common"

import { Actor, AuthGuard, Identity, requireAdmin } from "./auth"
import { Database } from "./database"
import { parse, semesterSchema } from "./validation"

@Injectable()
export class SemestersService {
  constructor(private readonly db: Database) {}
  current() {
    return this.db.semester.findFirst({ where: { isCurrent: true } })
  }
  list(a: Identity) {
    requireAdmin(a)
    return this.db.semester.findMany({ orderBy: { createdAt: "desc" } })
  }
  save(a: Identity, b: unknown, id?: string) {
    requireAdmin(a)
    const v = parse(semesterSchema, b)
    const data = {
      ...v,
      newStartsAt: new Date(v.newStartsAt),
      newEndsAt: new Date(v.newEndsAt),
      returningStartsAt: new Date(v.returningStartsAt),
      returningEndsAt: new Date(v.returningEndsAt),
    }
    return this.db.transaction(async (tx) => {
      if (id) {
        const previous = await tx.semester.findUniqueOrThrow({ where: { id } })
        if (
          previous.consentText !== v.consentText &&
          previous.consentVersion === v.consentVersion
        )
          throw new BadRequestException(
            "동의문을 변경할 때 버전도 변경해 주세요."
          )
      }
      const s = id
        ? await tx.semester.update({ where: { id }, data })
        : await tx.semester.create({ data })
      await tx.auditLog.create({
        data: {
          actorId: a.id,
          entity: "Semester",
          entityId: s.id,
          action: "SAVE",
          details: { name: s.name },
        },
      })
      return s
    })
  }
  activate(a: Identity, id: string) {
    requireAdmin(a)
    return this.db.transaction(async (tx) => {
      await tx.semester.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      })
      const s = await tx.semester.update({
        where: { id },
        data: { isCurrent: true },
      })
      await tx.auditLog.create({
        data: {
          actorId: a.id,
          entity: "Semester",
          entityId: id,
          action: "ACTIVATE",
          details: {},
        },
      })
      return s
    })
  }
}
@Controller("semesters")
export class SemestersController {
  constructor(private readonly service: SemestersService) {}
  @Get("current") current() {
    return this.service.current()
  }
  @Get() @UseGuards(AuthGuard) list(@Actor() a: Identity) {
    return this.service.list(a)
  }
  @Post() @UseGuards(AuthGuard) create(
    @Actor() a: Identity,
    @Body() b: unknown
  ) {
    return this.service.save(a, b)
  }
  @Patch(":id") @UseGuards(AuthGuard) update(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    return this.service.save(a, b, id)
  }
  @Post(":id/activate") @UseGuards(AuthGuard) activate(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.service.activate(a, id)
  }
}

@Module({ controllers: [SemestersController], providers: [SemestersService] })
export class SemestersModule {}

import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
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
  managedStudyResponse,
  pageResponse,
  studyApplicationResponse,
  studyQuery,
  studyResponse,
} from "./swagger.schemas"
import { pagination, parse } from "./validation"

const text = z.string().trim().min(1).max(200)
const inputSchema = z
  .object({
    title: text,
    description: z.string().trim().min(1).max(15000),
    audience: text,
    format: text,
    schedule: text,
    location: text,
    resourceUrl: z
      .string()
      .url()
      .max(2000)
      .refine((v) => /^https?:\/\//.test(v))
      .nullable(),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    capacity: z.number().int().min(0).max(1000),
  })
  .refine(
    (v) => Date.parse(v.startsAt) < Date.parse(v.endsAt),
    "모집 종료는 시작 이후여야 합니다."
  )
const actionSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT", "CANCEL", "WITHDRAW"]),
    version: z.number().int().min(0),
    reason: z.string().trim().min(1).max(2000).optional(),
  })
  .refine(
    (v) => v.action !== "REJECT" || !!v.reason,
    "반려 사유를 입력해 주세요."
  )
const versionSchema = z.object({ version: z.number().int().min(0) })
const include = {
  semester: { select: { id: true, name: true, isCurrent: true } },
  _count: { select: { applications: { where: { status: "APPROVED" } } } },
} satisfies Prisma.StudyInclude
type Row = Prisma.StudyGetPayload<{ include: typeof include }>
function record(s: Row, privateFields = false) {
  const { representativeId, reason, _count, ...publicFields } = s
  return {
    ...publicFields,
    participantCount: _count.applications + (representativeId ? 1 : 0),
    ...(privateFields ? { representativeId, reason } : {}),
  }
}

@Injectable()
export class StudiesService {
  constructor(private readonly db: Database) {}
  async member(tx: Prisma.TransactionClient, a: Identity, semesterId: string) {
    const user = await tx.user.findUnique({ where: { authId: a.id } })
    const membership =
      user &&
      (await tx.membership.findUnique({
        where: { userId_semesterId: { userId: user.id, semesterId } },
      }))
    if (!user || membership?.status !== "APPROVED")
      throw new ForbiddenException(
        "해당 학기의 승인된 부원만 이용할 수 있습니다."
      )
    return user
  }
  async editable(tx: Prisma.TransactionClient, a: Identity, s: Row) {
    if (a.isAdmin) return
    if (!s.semester.isCurrent)
      throw new ForbiddenException("이전 학기 기록은 변경할 수 없습니다.")
    const user = await this.member(tx, a, s.semesterId)
    if (s.representativeId !== user.id)
      throw new ForbiddenException("스터디장 권한이 필요합니다.")
  }
  async log(
    tx: Prisma.TransactionClient,
    a: Identity,
    id: string,
    action: string,
    details: Prisma.InputJsonValue = {}
  ) {
    await tx.auditLog.create({
      data: {
        actorId: a.id,
        entity: "Study",
        entityId: id,
        action,
        details,
      },
    })
  }
  async list(
    query: {
      page?: string
      semesterId?: string
      type?: string
      status?: string
      q?: string
    },
    a?: Identity
  ) {
    if (a) requireAdmin(a)
    const filters = parse(
      z.object({
        semesterId: z.string().uuid().optional(),
        type: z.enum(["REGULAR", "AUTONOMOUS"]).optional(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
        q: z.string().max(200).optional(),
      }),
      query
    )
    const { page, pageSize, skip } = pagination(query)
    const where: Prisma.StudyWhereInput = {
      ...(filters.semesterId
        ? { semesterId: filters.semesterId }
        : a
          ? {}
          : { semester: { isCurrent: true } }),
      type: filters.type,
      status: a ? filters.status : "APPROVED",
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { audience: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    }
    const [items, total] = await Promise.all([
      this.db.study.findMany({
        where,
        include,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.db.study.count({ where }),
    ])
    return { items: items.map((s) => record(s, !!a)), total, page, pageSize }
  }
  async detail(id: string) {
    const s = await this.db.study.findUnique({ where: { id }, include })
    if (!s || s.status !== "APPROVED")
      throw new NotFoundException("스터디를 찾을 수 없습니다.")
    return record(s)
  }
  async mine(a: Identity) {
    const user = await this.db.user.findUnique({ where: { authId: a.id } })
    if (!user) return { studies: [], applications: [] }
    const studies = await this.db.study.findMany({
      where: { representativeId: user.id },
      include,
      orderBy: { createdAt: "desc" },
    })
    const applications = await this.db.studyApplication.findMany({
      where: { userId: user.id },
      include: { study: { include } },
      orderBy: { createdAt: "desc" },
    })
    return {
      studies: studies.map((s) => record(s, true)),
      applications: applications.map(({ study, ...application }) => ({
        ...application,
        study: record(study),
      })),
    }
  }
  async management(a: Identity, id: string) {
    const s = await this.db.study.findUniqueOrThrow({ where: { id }, include })
    // Viewing historical records does not require current membership.
    const user = await this.db.user.findUnique({ where: { authId: a.id } })
    if (!a.isAdmin && (!user || s.representativeId !== user.id))
      throw new ForbiddenException("스터디장 권한이 필요합니다.")
    const applications = await this.db.studyApplication.findMany({
      where: { studyId: id },
      include: {
        user: { select: { name: true, studentId: true, department: true } },
      },
      orderBy: { createdAt: "asc" },
    })
    return { study: record(s, true), applications }
  }
  save(a: Identity, body: unknown, id?: string, admin = false) {
    if (admin) requireAdmin(a)
    const v = parse(inputSchema, body)
    const version = id ? parse(versionSchema, body).version : undefined
    const adminInput =
      admin && !id
        ? parse(
            z.object({
              semesterId: z.string().uuid(),
              type: z.enum(["REGULAR", "AUTONOMOUS"]),
              representativeId: z.string().uuid().nullable().optional(),
            }),
            body
          )
        : null
    return this.db.transaction(async (tx) => {
      const previous = id
        ? await tx.study.findUniqueOrThrow({ where: { id }, include })
        : null
      const semester = previous
        ? previous.semester
        : await tx.semester.findFirst({
            where: adminInput
              ? { id: adminInput.semesterId }
              : { isCurrent: true },
          })
      if (!semester) throw new ConflictException("운영 학기를 설정해 주세요.")
      let representativeId =
        previous?.representativeId ?? adminInput?.representativeId ?? null
      if (previous) {
        await this.editable(tx, a, previous)
        if (previous.version !== version)
          throw new ConflictException("새로고침 후 다시 시도해 주세요.")
        if (v.capacity < record(previous).participantCount)
          throw new ConflictException(
            "정원은 현재 참여 인원 이상이어야 합니다."
          )
      } else if (!admin) {
        representativeId = (await this.member(tx, a, semester.id)).id
      }
      const type = previous?.type ?? adminInput?.type ?? "AUTONOMOUS"
      if (type === "AUTONOMOUS" && v.capacity === 0)
        throw new ConflictException("자율 스터디 정원은 1명 이상이어야 합니다.")
      if (type === "AUTONOMOUS" && !representativeId)
        throw new ConflictException("자율 스터디 스터디장가 필요합니다.")
      if (!previous && admin && representativeId) {
        const representative = await tx.user.findUniqueOrThrow({
          where: { id: representativeId },
        })
        if (!representative.authId)
          throw new ConflictException("계정 연결된 스터디장가 필요합니다.")
        await this.member(tx, { ...a, id: representative.authId }, semester.id)
      }
      const data = {
        ...v,
        startsAt: new Date(v.startsAt),
        endsAt: new Date(v.endsAt),
        status: type === "REGULAR" || admin ? "APPROVED" : "PENDING",
        reason: null,
      }
      const s = previous
        ? await tx.study.update({
            where: { id },
            data: { ...data, version: { increment: 1 } },
            include,
          })
        : await tx.study.create({
            data: { ...data, type, semesterId: semester.id, representativeId },
            include,
          })
      await this.log(tx, a, s.id, previous ? "EDIT" : "CREATE")
      return record(s, true)
    })
  }
  review(a: Identity, id: string, body: unknown) {
    requireAdmin(a)
    const v = parse(actionSchema, body)
    if (!["APPROVE", "REJECT"].includes(v.action))
      throw new ConflictException("개설 승인 또는 반려를 선택해 주세요.")
    return this.db.transaction(async (tx) => {
      const s = await tx.study.findUniqueOrThrow({ where: { id }, include })
      if (
        s.type !== "AUTONOMOUS" ||
        s.status !== "PENDING" ||
        s.version !== v.version
      )
        throw new ConflictException(
          "승인 대기인 자율 스터디만 처리할 수 있습니다."
        )
      const result = await tx.study.update({
        where: { id },
        data: {
          status: v.action === "APPROVE" ? "APPROVED" : "REJECTED",
          reason: v.reason ?? null,
          version: { increment: 1 },
        },
        include,
      })
      await this.log(tx, a, id, v.action, { reason: v.reason ?? null })
      return record(result, true)
    })
  }
  apply(a: Identity, id: string, body: unknown) {
    const v = parse(
      z.object({ motivation: z.string().trim().min(1).max(2000) }),
      body
    )
    return this.db.transaction(async (tx) => {
      const s = await tx.study.findUniqueOrThrow({ where: { id }, include })
      const now = new Date()
      if (
        !s.semester.isCurrent ||
        s.isLegacy ||
        s.type !== "AUTONOMOUS" ||
        s.status !== "APPROVED" ||
        now < s.startsAt ||
        now >= s.endsAt
      )
        throw new ConflictException("현재 신청 가능한 스터디가 아닙니다.")
      const user = await this.member(tx, a, s.semesterId)
      if (s.representativeId === user.id)
        throw new ConflictException("스터디장는 이미 참여 중입니다.")
      if (record(s).participantCount >= s.capacity)
        throw new ConflictException("정원이 찼습니다.")
      const previous = await tx.studyApplication.findUnique({
        where: { studyId_userId: { studyId: id, userId: user.id } },
      })
      if (previous && !["CANCELLED", "WITHDRAWN"].includes(previous.status))
        throw new ConflictException("이미 신청한 스터디입니다.")
      const result = previous
        ? await tx.studyApplication.update({
            where: { id: previous.id },
            data: {
              motivation: v.motivation,
              status: "PENDING",
              reason: null,
              version: { increment: 1 },
            },
          })
        : await tx.studyApplication.create({
            data: { studyId: id, userId: user.id, motivation: v.motivation },
          })
      await this.log(tx, a, id, "APPLY", { applicationId: result.id })
      return result
    })
  }
  applicationAction(
    a: Identity,
    id: string,
    applicationId: string,
    body: unknown
  ) {
    const v = parse(actionSchema, body)
    return this.db.transaction(async (tx) => {
      const s = await tx.study.findUniqueOrThrow({ where: { id }, include })
      const application = await tx.studyApplication.findUniqueOrThrow({
        where: { id: applicationId },
      })
      if (application.studyId !== id || application.version !== v.version)
        throw new ConflictException("신청 상태가 변경되었습니다.")
      if (v.action === "CANCEL") {
        const user = await this.member(tx, a, s.semesterId)
        if (!s.semester.isCurrent || user.id !== application.userId)
          throw new ForbiddenException()
        if (application.status !== "PENDING")
          throw new ConflictException("대기 신청만 취소할 수 있습니다.")
      } else {
        await this.editable(tx, a, s)
        if (v.action === "WITHDRAW") {
          if (application.status !== "APPROVED")
            throw new ConflictException("참여자만 탈퇴 처리할 수 있습니다.")
        } else {
          if (s.status !== "APPROVED" || application.status !== "PENDING")
            throw new ConflictException(
              "승인된 스터디의 대기 신청만 선발할 수 있습니다."
            )
          if (v.action === "APPROVE") {
            const user = await tx.user.findUniqueOrThrow({
              where: { id: application.userId },
            })
            if (!user.authId)
              throw new ConflictException("신청자의 계정 연결을 확인해 주세요.")
            await this.member(tx, { ...a, id: user.authId }, s.semesterId)
            if (record(s).participantCount >= s.capacity)
              throw new ConflictException("정원이 찼습니다.")
          }
        }
      }
      const status = {
        APPROVE: "APPROVED",
        REJECT: "REJECTED",
        CANCEL: "CANCELLED",
        WITHDRAW: "WITHDRAWN",
      }[v.action]
      const result = await tx.studyApplication.update({
        where: { id: applicationId },
        data: { status, reason: v.reason ?? null, version: { increment: 1 } },
      })
      await this.log(tx, a, id, `APPLICATION_${v.action}`, {
        applicationId,
        reason: v.reason ?? null,
      })
      return result
    })
  }
}
@ApiTags("스터디")
@Controller("studies")
export class StudiesController {
  constructor(private readonly service: StudiesService) {}
  @ApiEndpoint({
    summary: "공개 스터디 목록 조회",
    query: studyQuery,
    response: pageResponse(studyResponse),
    description:
      "승인된 스터디만 반환합니다. status 필터는 공개 목록에 적용되지 않습니다.",
  })
  @Get()
  list(@Query() q: Parameters<StudiesService["list"]>[0]) {
    return this.service.list(q)
  }
  @ApiEndpoint({
    summary: "내 개설 및 신청 스터디 조회",
    auth: true,
    response: z.object({
      studies: z.array(managedStudyResponse),
      applications: z.array(
        studyApplicationResponse.extend({ study: studyResponse })
      ),
    }),
  })
  @Get("me")
  @UseGuards(AuthGuard)
  mine(@Actor() a: Identity) {
    return this.service.mine(a)
  }
  @ApiEndpoint({
    summary: "관리자 스터디 목록 조회",
    admin: true,
    query: studyQuery.extend({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    }),
    response: pageResponse(managedStudyResponse),
  })
  @Get("admin")
  @UseGuards(AuthGuard)
  admin(
    @Actor() a: Identity,
    @Query() q: Parameters<StudiesService["list"]>[0]
  ) {
    return this.service.list(q, a)
  }
  @ApiEndpoint({
    summary: "관리자 스터디 등록",
    admin: true,
    body: inputSchema.safeExtend({
      semesterId: z.uuid(),
      type: z.enum(["REGULAR", "AUTONOMOUS"]),
      representativeId: z.uuid().nullable().optional(),
    }),
    response: managedStudyResponse,
    status: 201,
    description:
      "모집 종료는 시작 이후여야 합니다. 정규 스터디는 capacity 0이면 정원 제한 없음, 자율 스터디는 정원 1 이상 및 승인된 부원 스터디장이 필요합니다.",
  })
  @Post("admin")
  @UseGuards(AuthGuard)
  createAdmin(@Actor() a: Identity, @Body() b: unknown) {
    return this.service.save(a, b, undefined, true)
  }
  @ApiEndpoint({
    summary: "관리자 스터디 수정",
    admin: true,
    params: ["id"],
    body: inputSchema.safeExtend(versionSchema.shape),
    response: managedStudyResponse,
    description: "전체 스터디 정보와 현재 version을 전달합니다.",
  })
  @Patch("admin/:id")
  @UseGuards(AuthGuard)
  updateAdmin(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    requireAdmin(a)
    return this.service.save(a, b, id, true)
  }
  @ApiEndpoint({
    summary: "자율 스터디 개설 신청",
    auth: true,
    body: inputSchema,
    response: managedStudyResponse,
    status: 201,
    description:
      "현재 학기의 승인된 부원만 신청 가능합니다. 정원은 1 이상이며 모집 종료는 시작 이후여야 합니다.",
  })
  @Post()
  @UseGuards(AuthGuard)
  create(@Actor() a: Identity, @Body() b: unknown) {
    return this.service.save(a, b)
  }
  @ApiEndpoint({
    summary: "스터디 관리 정보 및 신청자 조회",
    auth: true,
    params: ["id"],
    response: z.object({
      study: managedStudyResponse,
      applications: z.array(
        studyApplicationResponse.extend({
          user: z.object({
            name: z.string(),
            studentId: z.string(),
            department: z.string(),
          }),
        })
      ),
    }),
    description: "관리자 또는 해당 스터디장만 조회 가능합니다.",
  })
  @Get(":id/manage")
  @UseGuards(AuthGuard)
  manage(@Actor() a: Identity, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.management(a, id)
  }
  @ApiEndpoint({
    summary: "공개 스터디 상세 조회",
    params: ["id"],
    response: studyResponse,
  })
  @Get(":id")
  detail(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.detail(id)
  }
  @ApiEndpoint({
    summary: "스터디 정보 수정",
    auth: true,
    params: ["id"],
    body: inputSchema.safeExtend(versionSchema.shape),
    response: managedStudyResponse,
    description:
      "관리자 또는 현재 학기의 승인된 부원인 스터디장이 전체 정보와 현재 version을 전달합니다.",
  })
  @Patch(":id")
  @UseGuards(AuthGuard)
  update(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    return this.service.save(a, b, id)
  }
  @ApiEndpoint({
    summary: "자율 스터디 개설 승인 또는 반려",
    admin: true,
    params: ["id"],
    body: actionSchema.safeExtend({ action: z.enum(["APPROVE", "REJECT"]) }),
    response: managedStudyResponse,
    status: 201,
    description:
      "반려 시 reason이 필요합니다. version은 조회한 현재 버전입니다.",
  })
  @Post(":id/review")
  @UseGuards(AuthGuard)
  review(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    return this.service.review(a, id, b)
  }
  @ApiEndpoint({
    summary: "자율 스터디 참여 신청",
    auth: true,
    params: ["id"],
    body: z.object({ motivation: z.string().trim().min(1).max(2000) }),
    response: studyApplicationResponse,
    status: 201,
    description: "현재 학기의 승인된 부원만 모집 기간 내 신청할 수 있습니다.",
  })
  @Post(":id/applications")
  @UseGuards(AuthGuard)
  apply(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    return this.service.apply(a, id, b)
  }
  @ApiEndpoint({
    summary: "스터디 참여 신청 처리",
    auth: true,
    params: ["id", "applicationId"],
    body: actionSchema,
    response: studyApplicationResponse,
    status: 201,
    description:
      "CANCEL은 신청 본인, APPROVE·REJECT·WITHDRAW는 관리자 또는 스터디장이 처리합니다. 반려 시 reason이 필요하며 version은 신청의 현재 버전입니다.",
  })
  @Post(":id/applications/:applicationId/actions")
  @UseGuards(AuthGuard)
  action(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Body() b: unknown
  ) {
    return this.service.applicationAction(a, id, applicationId, b)
  }
}
@Module({ controllers: [StudiesController], providers: [StudiesService] })
export class StudiesModule {}

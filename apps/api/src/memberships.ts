import {
  BadRequestException,
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
  membershipDetailResponse,
  membershipResponse,
  pageResponse,
  searchQuery,
} from "./swagger.schemas"
import { pagination, parse, profileSchema } from "./validation"

const applicationSchema = z.object({
  profile: profileSchema,
  consent: z.literal(true),
  consentVersion: z.string().min(1),
})
const actionSchema = z
  .object({
    action: z.enum([
      "CONFIRM_LINK",
      "PAYMENT",
      "APPROVE",
      "REJECT",
      "REQUEST_CHANGES",
    ]),
    version: z.number().int().min(0),
    confirmed: z.boolean().optional(),
    reason: z.string().trim().max(2000).optional(),
  })
  .refine(
    (v) =>
      !["REJECT", "REQUEST_CHANGES"].includes(v.action) || Boolean(v.reason),
    "사유를 입력해 주세요."
  )
  .refine(
    (v) => v.action !== "PAYMENT" || v.confirmed !== undefined,
    "입금 확인 여부를 지정해 주세요."
  )

@Injectable()
export class MembershipsService {
  constructor(private readonly db: Database) {}
  mine(a: Identity) {
    return this.db.membership.findMany({
      where: { OR: [{ applicantAuthId: a.id }, { user: { authId: a.id } }] },
      include: { semester: true },
      orderBy: { createdAt: "desc" },
    })
  }
  async submit(a: Identity, b: unknown, id?: string) {
    const v = parse(applicationSchema, b)
    return this.db.transaction(async (tx) => {
      if (id) {
        const m = await tx.membership.findUnique({ where: { id } })
        if (!m) throw new NotFoundException()
        if (m.applicantAuthId !== a.id) throw new ForbiddenException()
        if (!["PENDING", "CHANGES_REQUESTED"].includes(m.status))
          throw new ConflictException("수정할 수 없는 신청입니다.")
        const s = await tx.semester.findUniqueOrThrow({
          where: { id: m.semesterId },
        })
        if (s.consentVersion !== v.consentVersion)
          throw new ConflictException(
            "동의문이 변경되었습니다. 새로고침해 주세요."
          )
        const u = await tx.user.findUniqueOrThrow({ where: { id: m.userId } })
        if (u.studentId !== v.profile.studentId)
          throw new BadRequestException(
            "신청 후 학번 변경은 관리자에게 문의해 주세요."
          )
        const profile = { ...v.profile, email: a.email }
        if (m.linkConfirmed)
          await tx.user.update({
            where: { id: u.id },
            data: { ...profile, birthDate: new Date(profile.birthDate) },
          })
        const result = await tx.membership.update({
          where: { id },
          data: {
            profile,
            status: "PENDING",
            reason: null,
            consentText: s.consentText,
            consentVersion: s.consentVersion,
            consentedAt: new Date(),
            version: { increment: 1 },
          },
          include: { semester: true },
        })
        await tx.auditLog.create({
          data: {
            actorId: a.id,
            entity: "Membership",
            entityId: id,
            action: "RESUBMIT",
            details: {},
          },
        })
        return result
      }
      const s = await tx.semester.findFirst({ where: { isCurrent: true } })
      if (!s || !s.isOpen)
        throw new BadRequestException("현재 모집 중이 아닙니다.")
      if (s.consentVersion !== v.consentVersion)
        throw new ConflictException(
          "동의문이 변경되었습니다. 새로고침해 주세요."
        )
      let u = await tx.user.findUnique({
        where: { studentId: v.profile.studentId },
      })
      const linked = await tx.user.findUnique({ where: { authId: a.id } })
      if (linked && linked.studentId !== v.profile.studentId)
        throw new ConflictException(
          "연결된 학번과 다릅니다. 관리자에게 문의해 주세요."
        )
      if (u?.authId && u.authId !== a.id)
        throw new ConflictException(
          "이미 연결된 학번입니다. 관리자에게 문의해 주세요."
        )
      const returning = u
        ? await tx.membership.findFirst({
            where: {
              userId: u.id,
              status: "APPROVED",
              semester: { newStartsAt: { lt: s.newStartsAt } },
            },
          })
        : null
      const type = returning ? "RETURNING" : "NEW"
      const start = type === "NEW" ? s.newStartsAt : s.returningStartsAt
      const end = type === "NEW" ? s.newEndsAt : s.returningEndsAt
      const now = new Date()
      if (now < start || now >= end)
        throw new BadRequestException("신청 기간이 아닙니다.")
      const profile = { ...v.profile, email: a.email }
      if (!u)
        u = await tx.user.create({
          data: {
            ...profile,
            birthDate: new Date(profile.birthDate),
            authId: a.id,
          },
        })
      else if (u.authId === a.id)
        await tx.user.update({
          where: { id: u.id },
          data: { ...profile, birthDate: new Date(profile.birthDate) },
        })
      const m = await tx.membership.create({
        data: {
          userId: u.id,
          semesterId: s.id,
          applicantAuthId: a.id,
          type,
          linkConfirmed: u.authId === a.id,
          profile,
          fee: type === "NEW" ? s.newFee : s.returningFee,
          consentText: s.consentText,
          consentVersion: s.consentVersion,
          consentedAt: now,
        },
        include: { semester: true },
      })
      await tx.auditLog.create({
        data: {
          actorId: a.id,
          entity: "Membership",
          entityId: m.id,
          action: "SUBMIT",
          details: {},
        },
      })
      return m
    })
  }
  async list(
    a: Identity,
    q: {
      page?: string
      search?: string
      semesterId?: string
      type?: string
      status?: string
      payment?: string
    }
  ) {
    requireAdmin(a)
    const p = pagination(q)
    if (q.semesterId) parse(z.uuid(), q.semesterId)
    if (
      (q.type && !["NEW", "RETURNING"].includes(q.type)) ||
      (q.status &&
        !["PENDING", "CHANGES_REQUESTED", "APPROVED", "REJECTED"].includes(
          q.status
        )) ||
      (q.payment && !["true", "false"].includes(q.payment))
    )
      throw new BadRequestException("필터를 확인해 주세요.")
    const where: Prisma.MembershipWhereInput = {
      semesterId: q.semesterId || undefined,
      type: q.type || undefined,
      status: q.status || undefined,
      paymentConfirmed: q.payment ? q.payment === "true" : undefined,
      ...(q.search
        ? {
            OR: [
              { user: { name: { contains: q.search, mode: "insensitive" } } },
              { user: { studentId: { contains: q.search } } },
              { profile: { path: ["name"], string_contains: q.search } },
            ],
          }
        : {}),
    }
    const [items, total] = await Promise.all([
      this.db.membership.findMany({
        where,
        include: { semester: true },
        skip: p.skip,
        take: p.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.db.membership.count({ where }),
    ])
    return { ...p, items, total }
  }
  async detail(a: Identity, id: string) {
    requireAdmin(a)
    const m = await this.db.membership.findUnique({
      where: { id },
      include: { semester: true, user: true },
    })
    if (!m) throw new NotFoundException()
    return {
      ...m,
      audit: await this.db.auditLog.findMany({
        where: { entityId: id },
        orderBy: { createdAt: "desc" },
      }),
    }
  }
  async action(a: Identity, id: string, b: unknown) {
    requireAdmin(a)
    const v = parse(actionSchema, b)
    return this.db.transaction(async (tx) => {
      const m = await tx.membership.findUnique({ where: { id } })
      if (!m) throw new NotFoundException()
      if (m.version !== v.version)
        throw new ConflictException(
          "다른 처리가 반영되었습니다. 새로고침해 주세요."
        )
      const data: Prisma.MembershipUpdateInput = { version: { increment: 1 } }
      if (v.action === "CONFIRM_LINK") {
        const u = await tx.user.findUniqueOrThrow({ where: { id: m.userId } })
        if (!m.applicantAuthId)
          throw new ConflictException("연결할 신청 계정이 없습니다.")
        if (u.authId && u.authId !== m.applicantAuthId)
          throw new ConflictException("다른 계정에 연결된 학번입니다.")
        const profile = parse(profileSchema, m.profile)
        const email = (m.profile as { email: string }).email
        await tx.user.update({
          where: { id: u.id },
          data: {
            ...profile,
            birthDate: new Date(profile.birthDate),
            authId: m.applicantAuthId,
            email,
          },
        })
        data.linkConfirmed = true
      } else if (v.action === "PAYMENT") {
        if (m.status === "APPROVED" && !v.confirmed)
          throw new ConflictException(
            "승인된 신청의 입금 확인을 취소할 수 없습니다."
          )
        data.paymentConfirmed = v.confirmed
      } else {
        if (!["PENDING", "CHANGES_REQUESTED"].includes(m.status))
          throw new ConflictException("이미 처리가 완료된 신청입니다.")
        if (v.action === "APPROVE" && (!m.linkConfirmed || !m.paymentConfirmed))
          throw new ConflictException("계정 연결과 입금 확인이 필요합니다.")
        data.status =
          v.action === "APPROVE"
            ? "APPROVED"
            : v.action === "REJECT"
              ? "REJECTED"
              : "CHANGES_REQUESTED"
        data.reason = v.reason ?? null
      }
      const result = await tx.membership.update({
        where: { id },
        data,
        include: { semester: true },
      })
      await tx.auditLog.create({
        data: {
          actorId: a.id,
          entity: "Membership",
          entityId: id,
          action: v.action,
          details: { reason: v.reason ?? null, confirmed: v.confirmed ?? null },
        },
      })
      return result
    })
  }
  async historical(a: Identity, b: unknown) {
    requireAdmin(a)
    const v = parse(z.object({ userId: z.uuid(), semesterId: z.uuid() }), b)
    return this.db.transaction(async (tx) => {
      const u = await tx.user.findUniqueOrThrow({ where: { id: v.userId } })
      const s = await tx.semester.findUniqueOrThrow({
        where: { id: v.semesterId },
      })
      if (s.isCurrent || s.newStartsAt > new Date())
        throw new BadRequestException("과거 학기만 등록할 수 있습니다.")
      const past = await tx.membership.findFirst({
        where: {
          userId: u.id,
          status: "APPROVED",
          semester: { newStartsAt: { lt: s.newStartsAt } },
        },
      })
      const m = await tx.membership.create({
        data: {
          ...v,
          type: past ? "RETURNING" : "NEW",
          status: "APPROVED",
          paymentConfirmed: true,
          linkConfirmed: Boolean(u.authId),
          profile: {
            name: u.name,
            studentId: u.studentId,
            department: u.department,
            phone: u.phone,
            email: u.email,
            birthDate: u.birthDate.toISOString().slice(0, 10),
            academicStatus: u.academicStatus,
            academicOther: u.academicOther,
            campus: u.campus,
          },
          fee: 0,
          consentText: "",
          consentVersion: "historical",
        },
        include: { semester: true },
      })
      await tx.auditLog.create({
        data: {
          actorId: a.id,
          entity: "Membership",
          entityId: m.id,
          action: "HISTORICAL_IMPORT",
          details: {},
        },
      })
      return m
    })
  }
}
@ApiTags("가입 신청")
@Controller("memberships")
@UseGuards(AuthGuard)
export class MembershipsController {
  constructor(private readonly service: MembershipsService) {}
  @ApiEndpoint({
    summary: "내 가입 신청 조회",
    auth: true,
    response: z.array(membershipResponse),
  })
  @Get("me")
  mine(@Actor() a: Identity) {
    return this.service.mine(a)
  }
  @ApiEndpoint({
    summary: "현재 학기 가입 신청",
    auth: true,
    body: applicationSchema,
    response: membershipResponse,
    status: 201,
    description:
      "현재 모집 기간에만 신청할 수 있습니다. consentVersion은 현재 학기의 동의문 버전입니다.",
  })
  @Post()
  submit(@Actor() a: Identity, @Body() b: unknown) {
    return this.service.submit(a, b)
  }
  @ApiEndpoint({
    summary: "가입 신청 수정 및 재제출",
    auth: true,
    params: ["id"],
    body: applicationSchema,
    response: membershipResponse,
    description:
      "본인의 대기 또는 보완 요청 신청만 수정할 수 있습니다. 신청 후 학번은 변경할 수 없습니다.",
  })
  @Patch(":id")
  resubmit(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    return this.service.submit(a, b, id)
  }
  @ApiEndpoint({
    summary: "가입 신청 목록 조회",
    admin: true,
    query: searchQuery.extend({
      semesterId: z.uuid(),
      type: z.enum(["NEW", "RETURNING"]),
      status: z.enum(["PENDING", "CHANGES_REQUESTED", "APPROVED", "REJECTED"]),
      payment: z.enum(["true", "false"]),
    }),
    response: pageResponse(membershipResponse, true),
  })
  @Get()
  list(
    @Actor() a: Identity,
    @Query() q: Parameters<MembershipsService["list"]>[1]
  ) {
    return this.service.list(a, q)
  }
  @ApiEndpoint({
    summary: "과거 학기 가입 이력 등록",
    admin: true,
    body: z.object({ userId: z.uuid(), semesterId: z.uuid() }),
    response: membershipResponse,
    status: 201,
  })
  @Post("historical")
  historical(@Actor() a: Identity, @Body() b: unknown) {
    return this.service.historical(a, b)
  }
  @ApiEndpoint({
    summary: "가입 신청 상세 및 감사 이력 조회",
    admin: true,
    params: ["id"],
    response: membershipDetailResponse,
  })
  @Get(":id")
  detail(@Actor() a: Identity, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.detail(a, id)
  }
  @ApiEndpoint({
    summary: "가입 신청 처리",
    admin: true,
    params: ["id"],
    body: actionSchema,
    response: membershipResponse,
    status: 201,
    description:
      "version은 조회한 현재 버전입니다. PAYMENT는 confirmed가, REJECT와 REQUEST_CHANGES는 reason이 필요합니다.",
  })
  @Post(":id/actions")
  action(
    @Actor() a: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() b: unknown
  ) {
    return this.service.action(a, id, b)
  }
}

@Module({
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}

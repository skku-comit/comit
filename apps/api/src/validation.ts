import { BadRequestException } from "@nestjs/common"
import { z } from "zod"

const text = z.string().trim().min(1).max(200)
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v &&
      v <= new Date().toISOString().slice(0, 10),
    "생년월일을 확인해 주세요."
  )
export const profileSchema = z
  .object({
    name: text,
    studentId: z
      .string()
      .trim()
      .regex(/^\d{6,20}$/),
    department: text,
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+() -]{8,25}$/),
    birthDate: date,
    academicStatus: z.enum(["ENROLLED", "LEAVE", "GRADUATED", "OTHER"]),
    academicOther: z.string().trim().max(200).nullable().default(null),
    campus: z.enum(["NATURAL", "HUMANITIES"]),
  })
  .refine(
    (v) => v.academicStatus !== "OTHER" || Boolean(v.academicOther),
    "기타 학적 설명을 입력해 주세요."
  )
export const semesterSchema = z
  .object({
    name: text,
    newStartsAt: z.iso.datetime({ offset: true }),
    newEndsAt: z.iso.datetime({ offset: true }),
    returningStartsAt: z.iso.datetime({ offset: true }),
    returningEndsAt: z.iso.datetime({ offset: true }),
    newFee: z.number().int().min(0).max(10000000),
    returningFee: z.number().int().min(0).max(10000000),
    bank: text,
    accountNumber: text,
    accountHolder: text,
    consentText: z.string().trim().max(30000),
    consentVersion: text,
    isOpen: z.boolean(),
  })
  .refine(
    (v) =>
      Date.parse(v.newStartsAt) < Date.parse(v.newEndsAt) &&
      Date.parse(v.returningStartsAt) < Date.parse(v.returningEndsAt),
    "모집 종료는 시작 이후여야 합니다."
  )
  .refine(
    (v) => !v.isOpen || v.consentText.length > 0,
    "모집을 열려면 동의문이 필요합니다."
  )
export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input)
  if (!r.success)
    throw new BadRequestException(
      r.error.issues.map((i) => i.message).join(" / ")
    )
  return r.data
}
export function pagination(query: { page?: string }) {
  const page = Number(query.page ?? 1)
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000)
    throw new BadRequestException("페이지 번호를 확인해 주세요.")
  return { page, pageSize: 20, skip: (page - 1) * 20 }
}

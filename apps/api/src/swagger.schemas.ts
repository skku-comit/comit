import { z } from "zod"

import { semesterSchema } from "./validation"

const id = z.uuid()
const timestamp = z.iso.datetime({ offset: true })
const timestamps = { createdAt: timestamp, updatedAt: timestamp }
// 응답은 저장된 값을 표현하므로 입력용 길이·날짜·기간 검증을 적용하지 않는다.
export const userResponse = z.object({
  name: z.string(),
  studentId: z.string(),
  department: z.string(),
  phone: z.string(),
  academicStatus: z.enum(["ENROLLED", "LEAVE", "GRADUATED", "OTHER"]),
  campus: z.enum(["NATURAL", "HUMANITIES"]),
  id,
  authId: id.nullable(),
  email: z.string().nullable(),
  academicOther: z.string().nullable(),
  birthDate: timestamp,
  ...timestamps,
})
export const semesterResponse = z.object({
  ...semesterSchema.shape,
  id,
  isCurrent: z.boolean(),
  createdAt: timestamp,
})
export const membershipResponse = z.object({
  id,
  userId: id,
  semesterId: id,
  applicantAuthId: id.nullable(),
  type: z.enum(["NEW", "RETURNING"]),
  status: z.enum(["PENDING", "CHANGES_REQUESTED", "APPROVED", "REJECTED"]),
  paymentConfirmed: z.boolean(),
  linkConfirmed: z.boolean(),
  profile: z.object({
    name: z.string(),
    studentId: z.string(),
    department: z.string(),
    phone: z.string(),
    birthDate: z.string(),
    academicStatus: z.enum(["ENROLLED", "LEAVE", "GRADUATED", "OTHER"]),
    academicOther: z.string().nullable(),
    campus: z.enum(["NATURAL", "HUMANITIES"]),
    email: z.string().nullable().optional(),
  }),
  fee: z.number().int(),
  consentText: z.string(),
  consentVersion: z.string(),
  consentedAt: timestamp.nullable(),
  reason: z.string().nullable(),
  version: z.number().int(),
  semester: semesterResponse,
  ...timestamps,
})
export const membershipDetailResponse = membershipResponse.extend({
  user: userResponse,
  audit: z.array(
    z.object({
      id,
      actorId: z.string(),
      entity: z.string(),
      entityId: z.string(),
      action: z.string(),
      details: z.unknown(),
      createdAt: timestamp,
    })
  ),
})
export const studyResponse = z.object({
  id,
  semesterId: id,
  isLegacy: z.boolean(),
  type: z.enum(["REGULAR", "AUTONOMOUS"]),
  title: z.string(),
  description: z.string(),
  audience: z.string(),
  format: z.string(),
  schedule: z.string(),
  location: z.string(),
  resourceUrl: z.string().nullable(),
  startsAt: timestamp,
  endsAt: timestamp,
  capacity: z.number().int(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  version: z.number().int(),
  participantCount: z.number().int(),
  semester: z.object({ id, name: z.string(), isCurrent: z.boolean() }),
  ...timestamps,
})
export const managedStudyResponse = studyResponse.extend({
  representativeId: id.nullable(),
  reason: z.string().nullable(),
})
export const studyApplicationResponse = z.object({
  id,
  studyId: id,
  userId: id,
  motivation: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "WITHDRAWN"]),
  reason: z.string().nullable(),
  version: z.number().int(),
  ...timestamps,
})
export function pageResponse(item: z.ZodType, withSkip = false) {
  return z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    ...(withSkip ? { skip: z.number().int() } : {}),
  })
}
export const pageQuery = z.number().int().min(1).max(1000000).default(1)
export const searchQuery = z.object({
  page: pageQuery,
  search: z.string().describe("이름 또는 학번 검색"),
})
export const studyQuery = z.object({
  page: pageQuery,
  semesterId: id.describe(
    "생략하면 공개 목록은 현재 학기, 관리자 목록은 전체 학기"
  ),
  type: z.enum(["REGULAR", "AUTONOMOUS"]),
  q: z.string().max(200).describe("제목 또는 대상 검색"),
})

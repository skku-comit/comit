export type AcademicStatus = "ENROLLED" | "LEAVE" | "GRADUATED" | "OTHER"
export type Campus = "NATURAL" | "HUMANITIES"
export type MembershipStatus =
  "PENDING" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED"
export type RegistrationType = "NEW" | "RETURNING"
export interface ProfileInput {
  name: string
  studentId: string
  department: string
  phone: string
  birthDate: string
  academicStatus: AcademicStatus
  academicOther: string | null
  campus: Campus
}
export interface UserRecord extends ProfileInput {
  id: string
  email: string | null
  authId: string | null
}
export interface SemesterInput {
  name: string
  newStartsAt: string
  newEndsAt: string
  returningStartsAt: string
  returningEndsAt: string
  newFee: number
  returningFee: number
  bank: string
  accountNumber: string
  accountHolder: string
  consentText: string
  consentVersion: string
  isOpen: boolean
}
export interface SemesterRecord extends SemesterInput {
  id: string
  isCurrent: boolean
}
export interface MembershipRecord {
  id: string
  userId: string
  semesterId: string
  applicantAuthId: string | null
  type: RegistrationType
  status: MembershipStatus
  paymentConfirmed: boolean
  linkConfirmed: boolean
  profile: ProfileInput & { email: string | null }
  fee: number
  consentText: string
  consentVersion: string
  consentedAt: string | null
  reason: string | null
  version: number
  semester: SemesterRecord
}
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
export interface MeResponse {
  user: UserRecord | null
  email: string
  isAdmin: boolean
}

export interface MembershipApplicationInput {
  profile: ProfileInput
  consent: true
  consentVersion: string
}
export type MembershipActionInput =
  | { action: "CONFIRM_LINK" | "APPROVE"; version: number }
  | { action: "PAYMENT"; version: number; confirmed: boolean }
  | { action: "REJECT" | "REQUEST_CHANGES"; version: number; reason: string }
export interface HistoricalMembershipInput {
  userId: string
  semesterId: string
}

export type StudyType = "REGULAR" | "AUTONOMOUS"
export type StudyStatus = "PENDING" | "APPROVED" | "REJECTED"
export type StudyApplicationStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "WITHDRAWN"
export interface StudyInput {
  title: string
  description: string
  audience: string
  format: string
  schedule: string
  location: string
  resourceUrl: string | null
  startsAt: string
  endsAt: string
  /** 정규 스터디는 0이면 정원 제한 없음. 자율 스터디는 1 이상. */
  capacity: number
}
export interface StudyRecord extends StudyInput {
  /** 기존 운영 자료: 신청 종료, 미확인 과거 모집 날짜는 표시하지 않음. */
  isLegacy?: boolean
  id: string
  semesterId: string
  type: StudyType
  status: StudyStatus
  version: number
  participantCount: number
  semester: { id: string; name: string; isCurrent: boolean }
}
export interface ManagedStudyRecord extends StudyRecord {
  representativeId: string | null
  reason: string | null
}
export interface StudyApplicationRecord {
  id: string
  studyId: string
  userId: string
  motivation: string
  status: StudyApplicationStatus
  reason: string | null
  version: number
  user?: { name: string; studentId: string; department: string }
}
export interface MyStudiesResponse {
  studies: ManagedStudyRecord[]
  applications: (StudyApplicationRecord & { study: StudyRecord })[]
}

export interface StudyUpdateInput extends StudyInput {
  version: number
}
export interface AdminStudyInput extends StudyInput {
  semesterId: string
  type: StudyType
  representativeId?: string | null
}
export type StudyReviewInput =
  | { action: "APPROVE"; version: number }
  | { action: "REJECT"; version: number; reason: string }
export interface StudyApplicationInput {
  motivation: string
}
export type StudyApplicationActionInput =
  | { action: "APPROVE" | "CANCEL" | "WITHDRAW"; version: number }
  | { action: "REJECT"; version: number; reason: string }
export interface StudyManagementResponse {
  study: ManagedStudyRecord
  applications: StudyApplicationRecord[]
}

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

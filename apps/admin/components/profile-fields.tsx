"use client"

import type { ProfileInput } from "@comit/contracts"
import { Input } from "@comit/ui/components/input"

export function profileFromForm(form: FormData): ProfileInput {
  return {
    name: String(form.get("name")),
    studentId: String(form.get("studentId")),
    department: String(form.get("department")),
    phone: String(form.get("phone")),
    birthDate: String(form.get("birthDate")),
    academicStatus: String(
      form.get("academicStatus")
    ) as ProfileInput["academicStatus"],
    academicOther: String(form.get("academicOther") ?? "") || null,
    campus: String(form.get("campus")) as ProfileInput["campus"],
  }
}
export function ProfileFields({
  value,
  lockStudentId = false,
}: {
  value?: Partial<ProfileInput>
  lockStudentId?: boolean
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(
        [
          ["name", "이름", "text"],
          ["studentId", "학번", "text"],
          ["department", "학과", "text"],
          ["phone", "전화번호", "tel"],
          ["birthDate", "생년월일", "date"],
        ] as const
      ).map(([key, label, type]) => (
        <label key={key} className="grid gap-2 text-sm">
          {label}
          <Input
            name={key}
            type={type}
            required
            defaultValue={value?.[key]?.slice(
              0,
              key === "birthDate" ? 10 : undefined
            )}
            readOnly={key === "studentId" && lockStudentId}
          />
        </label>
      ))}
      <label className="grid gap-2 text-sm">
        학적 상태
        <select
          name="academicStatus"
          defaultValue={value?.academicStatus ?? "ENROLLED"}
          className="h-10 rounded-md border bg-background px-3"
        >
          <option value="ENROLLED">재학</option>
          <option value="LEAVE">휴학</option>
          <option value="GRADUATED">졸업</option>
          <option value="OTHER">기타</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        기타 학적 설명
        <Input name="academicOther" defaultValue={value?.academicOther ?? ""} />
      </label>
      <label className="grid gap-2 text-sm">
        주 활동 캠퍼스
        <select
          name="campus"
          defaultValue={value?.campus ?? "NATURAL"}
          className="h-10 rounded-md border bg-background px-3"
        >
          <option value="NATURAL">자연과학캠퍼스</option>
          <option value="HUMANITIES">인문사회캠퍼스</option>
        </select>
      </label>
    </div>
  )
}

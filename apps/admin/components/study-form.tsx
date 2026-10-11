"use client"

import type { StudyInput } from "@comit/contracts"
import { Button } from "@comit/ui/components/button"

export function StudyForm({
  value,
  busy,
  disabled = false,
  onSubmit,
}: {
  value?: StudyInput
  busy: boolean
  disabled?: boolean
  onSubmit: (input: StudyInput) => void
}) {
  function date(value?: string) {
    return value
      ? new Date(Date.parse(value) + 9 * 3600000).toISOString().slice(0, 16)
      : ""
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const get = (key: string) => String(f.get(key) ?? "").trim()
        onSubmit({
          title: get("title"),
          description: get("description"),
          audience: get("audience"),
          format: get("format"),
          schedule: get("schedule"),
          location: get("location"),
          resourceUrl: get("resourceUrl") || null,
          capacity: Number(get("capacity")),
          startsAt: new Date(`${get("startsAt")}:00+09:00`).toISOString(),
          endsAt: new Date(`${get("endsAt")}:00+09:00`).toISOString(),
        })
      }}
    >
      <fieldset disabled={busy || disabled} className="space-y-4">
        {[
          ["title", "제목"],
          ["audience", "참여 대상"],
          ["format", "진행 방식"],
          ["schedule", "활동 일정"],
          ["location", "장소"],
        ].map(([key, label]) => (
          <label key={key} className="block">
            {label}
            <input
              name={key}
              required
              maxLength={200}
              defaultValue={value?.[key as keyof StudyInput] ?? ""}
              className="mt-1 block w-full rounded-md border p-2"
            />
          </label>
        ))}
        <label className="block">
          상세 소개 · 커리큘럼
          <textarea
            name="description"
            required
            maxLength={15000}
            defaultValue={value?.description}
            rows={6}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </label>
        <label className="block">
          자료 링크 (선택)
          <input
            name="resourceUrl"
            type="url"
            maxLength={2000}
            defaultValue={value?.resourceUrl ?? ""}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </label>
        <label className="block">
          정원 (정규는 0이면 제한 없음, 자율은 스터디장 포함 1명 이상)
          <input
            name="capacity"
            type="number"
            min={0}
            max={1000}
            required
            defaultValue={value?.capacity ?? 10}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["startsAt", "모집 시작"],
            ["endsAt", "모집 종료"],
          ].map(([key, label]) => (
            <label key={key}>
              {label} (한국 시간)
              <input
                name={key}
                type="datetime-local"
                required
                defaultValue={date(value?.[key as "startsAt" | "endsAt"])}
                className="mt-1 block w-full rounded-md border p-2"
              />
            </label>
          ))}
        </div>
        <Button type="submit" disabled={busy || disabled}>
          {busy ? "처리 중…" : "저장 · 제출"}
        </Button>
      </fieldset>
    </form>
  )
}

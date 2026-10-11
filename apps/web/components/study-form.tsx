"use client"

import type { StudyInput } from "@comit/contracts"
import { Button } from "@comit/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"
import { Field, FieldDescription, FieldLabel } from "@comit/ui/components/field"
import { Input } from "@comit/ui/components/input"
import { Separator } from "@comit/ui/components/separator"
import { Textarea } from "@comit/ui/components/textarea"

export function StudyForm({
  value,
  busy,
  disabled = false,
  onSubmit,
  submitLabel = "저장 · 제출",
}: {
  value?: StudyInput
  busy: boolean
  disabled?: boolean
  onSubmit: (input: StudyInput) => void
  submitLabel?: string
}) {
  function date(value?: string) {
    return value
      ? new Date(Date.parse(value) + 9 * 3600000).toISOString().slice(0, 16)
      : ""
  }
  return (
    <form
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
      <fieldset disabled={busy || disabled} className="min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>스터디 소개</CardTitle>
            <CardDescription>
              함께 배울 주제와 진행 계획을 알려 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Field name="title">
              <FieldLabel>제목</FieldLabel>
              <Input
                name="title"
                required
                maxLength={200}
                defaultValue={value?.title}
                placeholder="예: 함께 배우는 Python"
              />
            </Field>
            <Field name="description">
              <FieldLabel>상세 소개 · 커리큘럼</FieldLabel>
              <Textarea
                name="description"
                required
                maxLength={15000}
                defaultValue={value?.description}
                rows={6}
                placeholder="학습 목표, 다룰 내용, 함께 진행할 활동을 적어 주세요."
              />
              <FieldDescription>
                참여자가 학습 방향을 알 수 있도록 구체적으로 작성해 주세요.
              </FieldDescription>
            </Field>
            <Field name="audience">
              <FieldLabel>참여 대상</FieldLabel>
              <Input
                name="audience"
                required
                maxLength={200}
                defaultValue={value?.audience}
                placeholder="예: 프로그래밍을 처음 배우는 부원"
              />
            </Field>
            <Separator />
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                ["format", "진행 방식", "예: 대면 실습과 온라인 자료 공유"],
                ["schedule", "활동 일정", "예: 매주 수요일 오후 7시"],
                ["location", "장소", "예: 교내 스터디룸 또는 온라인"],
              ].map(([key, label, placeholder]) => (
                <Field key={key} name={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <Input
                    name={key}
                    required
                    maxLength={200}
                    defaultValue={
                      value?.[key as "format" | "schedule" | "location"]
                    }
                    placeholder={placeholder}
                  />
                </Field>
              ))}
              <Field name="resourceUrl">
                <FieldLabel>
                  자료 링크{" "}
                  <span className="font-normal text-muted-foreground">
                    (선택)
                  </span>
                </FieldLabel>
                <Input
                  name="resourceUrl"
                  type="url"
                  maxLength={2000}
                  defaultValue={value?.resourceUrl ?? ""}
                  placeholder="https://"
                />
              </Field>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>모집 안내</CardTitle>
            <CardDescription>
              신청 기간과 함께할 인원을 정해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Field name="capacity">
              <FieldLabel>정원</FieldLabel>
              <Input
                name="capacity"
                type="number"
                min={1}
                max={1000}
                required
                defaultValue={value?.capacity ?? 10}
                className="sm:max-w-40"
              />
              <FieldDescription>
                자율 스터디의 정원에는 스터디장도 포함됩니다.
              </FieldDescription>
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                ["startsAt", "모집 시작"],
                ["endsAt", "모집 종료"],
              ].map(([key, label]) => (
                <Field key={key} name={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <Input
                    name={key}
                    type="datetime-local"
                    required
                    defaultValue={date(value?.[key as "startsAt" | "endsAt"])}
                    className="min-w-0"
                  />
                  <FieldDescription>한국 시간 기준</FieldDescription>
                </Field>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            제출 후 관리자가 개설 내용을 확인합니다.
          </p>
          <Button
            type="submit"
            disabled={busy || disabled}
            loading={busy}
            className="w-full sm:w-auto"
          >
            {busy ? "제출 중…" : submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

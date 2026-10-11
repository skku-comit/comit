"use client"

import { CalendarDays, ExternalLink, MapPin, Users, Video } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import type { MyStudiesResponse, StudyRecord } from "@comit/contracts"
import { Alert } from "@comit/ui/components/alert"
import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"
import { Field, FieldDescription, FieldLabel } from "@comit/ui/components/field"
import { Separator } from "@comit/ui/components/separator"
import { Textarea } from "@comit/ui/components/textarea"

import {
  StudyBackLink,
  StudyError,
  StudyParticipationSkeleton,
  StudyStatusBadge,
} from "@/components/study-ui"
import { api, koreanDate } from "@/lib/api"

export function StudyDetail({ study: s }: { study: StudyRecord }) {
  const [now, setNow] = useState<number | null>(null)
  const [mine, setMine] = useState<MyStudiesResponse>()
  const [accountLoaded, setAccountLoaded] = useState(false)
  const [accountError, setAccountError] = useState("")
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0)
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => {
      clearTimeout(initial)
      clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    let active = true
    api<MyStudiesResponse>("studies/me", undefined, "GET", {
      redirectOnUnauthorized: false,
    })
      .then((r) => {
        if (active) {
          setMine(r)
          setAccountError("")
        }
      })
      .catch((e) => {
        if (active) setAccountError(e.message)
      })
      .finally(() => {
        if (active) setAccountLoaded(true)
      })
    return () => {
      active = false
    }
  }, [retry])
  const application = mine?.applications.find((a) => a.studyId === s.id)
  const owner = mine?.studies.some((a) => a.id === s.id)
  const open =
    !s.isLegacy &&
    s.semester.isCurrent &&
    now !== null &&
    now >= Date.parse(s.startsAt) &&
    now < Date.parse(s.endsAt) &&
    s.participantCount < s.capacity
  return (
    <article className="mx-auto max-w-6xl px-6 py-16">
      <StudyBackLink />
      <div className="flex flex-wrap gap-2">
        <Badge variant="info">
          {s.type === "REGULAR" ? "정규" : "자율"} 스터디
        </Badge>
        <Badge>{s.semester.name}</Badge>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight break-words">
        {s.title}
      </h1>
      <p className="mt-3 text-muted-foreground">{s.audience}</p>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>함께 배우는 내용</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed break-words whitespace-pre-wrap">
                {s.description}
              </p>
              {s.resourceUrl && (
                <Button
                  className="mt-6"
                  variant="outline"
                  render={
                    <a href={s.resourceUrl} target="_blank" rel="noreferrer" />
                  }
                  nativeButton={false}
                >
                  자료 살펴보기
                  <ExternalLink aria-hidden />
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>진행 안내</CardTitle>
              <CardDescription>
                일정과 장소를 확인하고 함께할 준비를 해 주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-6 sm:grid-cols-2">
                {[
                  { label: "참여 대상", value: s.audience, icon: Users },
                  { label: "진행 방식", value: s.format, icon: Video },
                  { label: "활동 일정", value: s.schedule, icon: CalendarDays },
                  { label: "장소", value: s.location, icon: MapPin },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex min-w-0 gap-3">
                    <Icon
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <div>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="mt-1 text-sm font-medium break-words">
                        {value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>참여 안내</CardTitle>
            <CardDescription>
              {s.type === "AUTONOMOUS"
                ? "같은 관심사를 가진 부원과 함께해요."
                : "운영진이 준비한 커리큘럼으로 배워요."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Users aria-hidden className="size-4" />
                {s.isLegacy
                  ? `정원 ${s.capacity}명`
                  : s.type === "AUTONOMOUS"
                    ? `${s.participantCount}/${s.capacity}명 참여 중`
                    : s.capacity === 0
                      ? "정원 제한 없음"
                      : `정원 ${s.capacity}명`}
              </p>
              {s.type === "AUTONOMOUS" && !s.isLegacy && (
                <p className="mt-1 text-xs text-muted-foreground">
                  스터디장를 포함한 인원이에요.
                </p>
              )}
              <Separator className="my-4" />
              <p className="text-xs font-medium text-muted-foreground">
                모집 기간
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {s.isLegacy ? (
                  "모집 종료 · 기존 운영 스터디"
                ) : (
                  <>
                    {koreanDate(s.startsAt)}
                    <br />~ {koreanDate(s.endsAt)}
                  </>
                )}
              </p>
            </div>
            {s.isLegacy ? (
              <Alert variant="info" role="status">
                신청이 마감된 스터디입니다. 기존 참여 인원과 스터디장 계정은
                별도로 관리합니다.
              </Alert>
            ) : s.type === "REGULAR" ? (
              <Alert variant="info" role="status">
                {now !== null && now >= Date.parse(s.endsAt)
                  ? "정규 스터디 신청이 마감됐어요. 운영진이 신청 인원에 따라 팀을 구성합니다."
                  : "정규 스터디 참여는 운영진 안내를 확인해 주세요."}
              </Alert>
            ) : !accountLoaded || now === null ? (
              <StudyParticipationSkeleton />
            ) : owner ? (
              <>
                <Badge variant="success">스터디장로 참여 중</Badge>
                <Button
                  className="w-full"
                  render={<Link href={`/studies/${s.id}/manage`} />}
                  nativeButton={false}
                >
                  스터디 관리
                </Button>
              </>
            ) : submitted ? (
              <>
                <Alert variant="success" role="status">
                  신청이 접수됐어요. 스터디장가 신청 내용을 확인한 뒤
                  선발합니다.
                </Alert>
                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link href="/studies/mine" />}
                  nativeButton={false}
                >
                  내 신청 확인
                </Button>
              </>
            ) : application &&
              !["CANCELLED", "WITHDRAWN"].includes(application.status) ? (
              <>
                <StudyStatusBadge status={application.status} application />
                {application.reason && (
                  <p className="text-sm text-muted-foreground">
                    {application.reason}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link href="/studies/mine" />}
                  nativeButton={false}
                >
                  내 신청 확인
                </Button>
              </>
            ) : accountError ? (
              accountError.includes("로그인") ? (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    학교 계정으로 로그인하고 참여를 신청해 보세요.
                  </p>
                  <Button
                    className="w-full"
                    render={<Link href="/login" />}
                    nativeButton={false}
                  >
                    로그인하고 신청하기
                  </Button>
                </>
              ) : (
                <StudyError
                  message={accountError}
                  retry={() => {
                    setAccountLoaded(false)
                    setRetry(retry + 1)
                  }}
                />
              )
            ) : open ? (
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const f = new FormData(e.currentTarget)
                  setBusy(true)
                  setError("")
                  try {
                    await api(`studies/${s.id}/applications`, {
                      motivation: f.get("motivation"),
                    })
                    setSubmitted(true)
                  } catch (e) {
                    setError((e as Error).message)
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                <Field name="motivation">
                  <FieldLabel>참여 동기</FieldLabel>
                  <Textarea
                    name="motivation"
                    required
                    maxLength={2000}
                    disabled={busy}
                    placeholder="배우고 싶은 내용과 참여 이유를 알려 주세요."
                  />
                  <FieldDescription>
                    현재 학기 승인 부원만 신청할 수 있으며, 스터디장가 참여자를
                    선발해요.
                  </FieldDescription>
                </Field>
                <Button
                  type="submit"
                  loading={busy}
                  disabled={busy}
                  className="w-full"
                >
                  {busy ? "신청 중…" : "참여 신청"}
                </Button>
              </form>
            ) : (
              <Alert role="status">
                {!s.semester.isCurrent
                  ? "이전 학기 스터디는 신청이 종료됐어요."
                  : s.participantCount >= s.capacity
                    ? "함께할 인원이 모두 찼어요."
                    : now < Date.parse(s.startsAt)
                      ? "아직 모집 시작 전이에요."
                      : "참여 신청이 마감됐어요."}
              </Alert>
            )}
            {error && <StudyError message={error} />}
          </CardContent>
        </Card>
      </div>
    </article>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import type {
  MembershipRecord,
  MeResponse,
  SemesterRecord,
} from "@comit/contracts"
import { Button } from "@comit/ui/components/button"

import { ProfileFields, profileFromForm } from "@/components/profile-fields"
import { api, koreanDate, statusLabels } from "@/lib/api"

export default function MyPage() {
  const [me, setMe] = useState<MeResponse>()
  const [semester, setSemester] = useState<SemesterRecord | null>(null)
  const [memberships, setMemberships] = useState<MembershipRecord[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  async function load() {
    try {
      const [u, s, m] = await Promise.all([
        api<MeResponse>("users/me"),
        api<SemesterRecord | null>("semesters/current"),
        api<MembershipRecord[]>("memberships/me"),
      ])
      setMe(u)
      setSemester(s)
      setMemberships(m)
      setError("")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoaded(true)
    }
  }
  useEffect(() => {
    let active = true
    Promise.all([
      api<MeResponse>("users/me"),
      api<SemesterRecord | null>("semesters/current"),
      api<MembershipRecord[]>("memberships/me"),
    ])
      .then(([u, s, m]) => {
        if (active) {
          setMe(u)
          setSemester(s)
          setMemberships(m)
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])
  const current = memberships.find((m) => m.semesterId === semester?.id)
  const editable =
    !current || ["PENDING", "CHANGES_REQUESTED"].includes(current.status)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!semester) return
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await api(
        current ? `memberships/${current.id}` : "memberships",
        {
          profile: profileFromForm(form),
          consent: form.get("consent") === "on",
          consentVersion: semester.consentVersion,
        },
        current ? "PATCH" : "POST"
      )
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">내 활동 · 가입 신청</h1>
      <Link
        href="/studies/mine"
        className="mt-4 inline-block text-primary underline"
      >
        내 스터디 · 개설 및 참여 관리
      </Link>
      {error && (
        <p role="alert" className="my-4 text-destructive">
          {error}
          <Button variant="ghost" onClick={() => void load()}>
            다시 불러오기
          </Button>
        </p>
      )}
      {!loaded && <p role="status">불러오는 중…</p>}
      {loaded && !me && (
        <Button render={<Link href="/login" />} nativeButton={false}>
          로그인
        </Button>
      )}
      {me && (
        <>
          <div className="my-6 flex items-center justify-between">
            <p>{me.email}</p>
            <form action="/auth/logout" method="post">
              <Button variant="outline">로그아웃</Button>
            </form>
          </div>
          {!semester && <p>현재 운영 학기가 없습니다.</p>}
          {semester && (
            <section className="space-y-5 rounded-xl border p-6">
              <h2 className="text-xl font-semibold">{semester.name}</h2>
              <p>
                신규: {koreanDate(semester.newStartsAt)} ~{" "}
                {koreanDate(semester.newEndsAt)} /{" "}
                {semester.newFee.toLocaleString()}원
              </p>
              <p>
                재등록: {koreanDate(semester.returningStartsAt)} ~{" "}
                {koreanDate(semester.returningEndsAt)} /{" "}
                {semester.returningFee.toLocaleString()}원
              </p>
              <p>
                납부 계좌: {semester.bank} {semester.accountNumber} (
                {semester.accountHolder})
              </p>
              {!semester.isOpen && !current && (
                <p>현재 모집이 열려 있지 않습니다.</p>
              )}
              {current && (
                <div className="rounded-lg bg-muted p-4">
                  <p>
                    {statusLabels[current.type]} ·{" "}
                    {statusLabels[current.status]} · 입금{" "}
                    {current.paymentConfirmed ? "확인" : "미확인"}
                  </p>
                  <p>
                    회비: {current.fee.toLocaleString()}원 · 계정 연결{" "}
                    {current.linkConfirmed ? "확인" : "관리자 확인 대기"}
                  </p>
                  {current.reason && <p className="mt-2">{current.reason}</p>}
                </div>
              )}
              {editable && (semester.isOpen || current) && (
                <form
                  onSubmit={submit}
                  className="space-y-5"
                  key={current?.id ?? "new"}
                >
                  <ProfileFields
                    value={current?.profile ?? me.user ?? undefined}
                    lockStudentId={Boolean(current || me.user)}
                  />
                  <div className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                    {semester.consentText}
                  </div>
                  <label className="flex gap-2">
                    <input type="checkbox" name="consent" required />
                    개인정보 수집·이용에 동의합니다.
                  </label>
                  <Button disabled={busy}>
                    {busy
                      ? "처리 중…"
                      : current
                        ? "수정 · 재제출"
                        : "가입 · 재등록 신청"}
                  </Button>
                </form>
              )}
            </section>
          )}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">신청 이력</h2>
            {!memberships.length && <p>신청 이력이 없습니다.</p>}
            {memberships.map((m) => (
              <article key={m.id} className="mb-4 rounded-lg border p-4">
                <h3>
                  {m.semester.name} · {statusLabels[m.status]}
                </h3>
                <p>
                  {m.profile.name} · {m.profile.studentId} ·{" "}
                  {m.profile.department}
                </p>
                <fieldset disabled className="mt-4">
                  <legend className="mb-3 text-sm font-medium">
                    신청 정보
                  </legend>
                  <ProfileFields value={m.profile} />
                </fieldset>
                {m.reason && <p>{m.reason}</p>}
              </article>
            ))}
          </section>
        </>
      )}
    </section>
  )
}

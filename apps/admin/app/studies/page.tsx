"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import type {
  ManagedStudyRecord,
  PageResult,
  SemesterRecord,
  StudyApplicationRecord,
} from "@comit/contracts"
import { Button } from "@comit/ui/components/button"

import { StudyForm } from "@/components/study-form"
import { api } from "@/lib/api"

const labels: Record<string, string> = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
  WITHDRAWN: "탈퇴",
}
export default function Page() {
  const [semesters, setSemesters] = useState<SemesterRecord[]>([])
  const [semesterId, setSemesterId] = useState("")
  const [type, setType] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PageResult<ManagedStudyRecord>>()
  const [detail, setDetail] = useState<{
    study: ManagedStudyRecord
    applications: StudyApplicationRecord[]
  }>()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  const [creating, setCreating] = useState(false)
  const [reason, setReason] = useState("")
  const [reasons, setReasons] = useState<Record<string, string>>({})
  useEffect(() => {
    let active = true
    api<SemesterRecord[]>("semesters")
      .then((r) => {
        if (active) setSemesters(r)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) setLoading(true)
    })
    api<PageResult<ManagedStudyRecord>>(
      `studies/admin?page=${page}${semesterId ? `&semesterId=${semesterId}` : ""}${type ? `&type=${type}` : ""}${status ? `&status=${status}` : ""}`
    )
      .then((r) => {
        if (active) {
          setResult(r)
          setError("")
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, semesterId, type, status, retry])
  async function run(fn: () => Promise<unknown>, refresh = true) {
    setBusy(true)
    setError("")
    try {
      await fn()
      if (refresh) {
        if (detail) setDetail(await api(`studies/${detail.study.id}/manage`))
        setRetry(retry + 1)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <Link href="/" className="text-primary underline">
        부원 관리
      </Link>
      <h1 className="text-3xl font-bold">스터디 관리</h1>
      {error && (
        <p role="alert" className="text-destructive">
          {error} <Link href="/login">관리자 로그인</Link>{" "}
          <Button onClick={() => setRetry(retry + 1)}>다시 불러오기</Button>
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="학기 필터"
          className="rounded-md border p-2"
          value={semesterId}
          onChange={(e) => {
            setSemesterId(e.target.value)
            setPage(1)
          }}
        >
          <option value="">전체 학기</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label="유형 필터"
          className="rounded-md border p-2"
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            setPage(1)
          }}
        >
          <option value="">전체 유형</option>
          <option value="REGULAR">정규</option>
          <option value="AUTONOMOUS">자율</option>
        </select>
        <select
          aria-label="승인 상태 필터"
          className="rounded-md border p-2"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">전체 상태</option>
          {["PENDING", "APPROVED", "REJECTED"].map((s) => (
            <option key={s} value={s}>
              {labels[s]}
            </option>
          ))}
        </select>
        <Button
          onClick={() => {
            setCreating(!creating)
            setDetail(undefined)
          }}
        >
          정규 스터디 등록
        </Button>
      </div>
      {creating && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">정규 스터디 등록</h2>
          <p className="mb-4">등록할 학기를 필터에서 선택해 주세요.</p>
          <StudyForm
            busy={busy}
            disabled={!semesterId}
            onSubmit={(input) =>
              void run(async () => {
                await api("studies/admin", {
                  ...input,
                  semesterId,
                  type: "REGULAR",
                })
                setCreating(false)
              })
            }
          />
        </div>
      )}
      {loading && <p role="status">불러오는 중…</p>}
      {!loading && result && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.items.map((s) => (
              <article key={s.id} className="space-y-2 rounded-lg border p-4">
                <h2 className="font-semibold">{s.title}</h2>
                <p>
                  {s.semester.name} · {s.type === "REGULAR" ? "정규" : "자율"} ·{" "}
                  {labels[s.status]}
                </p>
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() =>
                    void run(async () => {
                      setDetail(await api(`studies/${s.id}/manage`))
                      setReason("")
                      setCreating(false)
                    }, false)
                  }
                >
                  상세 · 관리
                </Button>
              </article>
            ))}
          </div>
          {!result.items.length && <p>스터디가 없습니다.</p>}
          <div className="flex gap-3">
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              이전
            </Button>
            <span>{page} 페이지</span>
            <Button
              disabled={page * result.pageSize >= result.total}
              onClick={() => setPage(page + 1)}
            >
              다음
            </Button>
          </div>
        </>
      )}
      {detail && (
        <section className="space-y-5 rounded-xl border p-6">
          <h2 className="text-xl font-semibold">
            {detail.study.title} · {labels[detail.study.status]}
          </h2>
          <p>
            {detail.study.participantCount}/{detail.study.capacity}명
          </p>
          {detail.study.reason && <p>반려 사유: {detail.study.reason}</p>}
          {detail.study.status === "PENDING" && (
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    api(`studies/${detail.study.id}/review`, {
                      action: "APPROVE",
                      version: detail.study.version,
                    })
                  )
                }
              >
                개설 승인
              </Button>
              <input
                aria-label="개설 반려 사유"
                className="min-w-0 rounded-md border p-2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="반려 사유"
              />
              <Button
                disabled={busy || !reason.trim()}
                variant="outline"
                onClick={() =>
                  void run(() =>
                    api(`studies/${detail.study.id}/review`, {
                      action: "REJECT",
                      version: detail.study.version,
                      reason,
                    })
                  )
                }
              >
                개설 반려
              </Button>
            </div>
          )}
          {detail.study.isLegacy ? (
            <p>
              신청 마감된 기존 운영 자료입니다. 모집 기간과 기존 구성원 기록은
              미확인 상태이며 스터디장 계정 연결은 별도로 진행합니다.
            </p>
          ) : (
            <>
              <p>관리자가 수정·저장하면 개설 승인 상태로 공개됩니다.</p>
              <StudyForm
                key={`${detail.study.id}-${detail.study.version}`}
                value={detail.study}
                busy={busy}
                onSubmit={(input) =>
                  void run(() =>
                    api(
                      `studies/admin/${detail.study.id}`,
                      { ...input, version: detail.study.version },
                      "PATCH"
                    )
                  )
                }
              />
            </>
          )}
          <h3 className="font-semibold">참여 신청 · 구성원</h3>
          {!detail.applications.length && <p>신청자가 없습니다.</p>}
          {detail.applications.map((a) => (
            <article key={a.id} className="space-y-2 border-t pt-4">
              <p>
                {a.user?.name} · {a.user?.studentId} · {a.user?.department} ·{" "}
                {labels[a.status]}
              </p>
              <p className="whitespace-pre-wrap">{a.motivation}</p>
              {a.reason && <p>{a.reason}</p>}
              <div className="flex flex-wrap gap-3">
                {a.status === "PENDING" &&
                  detail.study.status === "APPROVED" && (
                    <>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void run(() =>
                            api(
                              `studies/${detail.study.id}/applications/${a.id}/actions`,
                              { action: "APPROVE", version: a.version }
                            )
                          )
                        }
                      >
                        참여 승인
                      </Button>
                      <input
                        aria-label={`${a.user?.name} 반려 사유`}
                        className="min-w-0 rounded-md border p-2"
                        value={reasons[a.id] ?? ""}
                        onChange={(e) =>
                          setReasons({ ...reasons, [a.id]: e.target.value })
                        }
                        placeholder="반려 사유"
                      />
                      <Button
                        disabled={busy || !reasons[a.id]?.trim()}
                        variant="outline"
                        onClick={() =>
                          void run(() =>
                            api(
                              `studies/${detail.study.id}/applications/${a.id}/actions`,
                              {
                                action: "REJECT",
                                version: a.version,
                                reason: reasons[a.id],
                              }
                            )
                          )
                        }
                      >
                        반려
                      </Button>
                    </>
                  )}
                {a.status === "APPROVED" && (
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() =>
                      void run(() =>
                        api(
                          `studies/${detail.study.id}/applications/${a.id}/actions`,
                          { action: "WITHDRAW", version: a.version }
                        )
                      )
                    }
                  >
                    탈퇴 처리
                  </Button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  )
}

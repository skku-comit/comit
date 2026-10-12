"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import type {
  MembershipRecord,
  MeResponse,
  PageResult,
  SemesterRecord,
  UserRecord,
} from "@comit/contracts"
import { Button } from "@comit/ui/components/button"
import { Input } from "@comit/ui/components/input"
import { Textarea } from "@comit/ui/components/textarea"

import { ProfileFields, profileFromForm } from "@/components/profile-fields"
import { api, statusLabels } from "@/lib/api"
import { apiUrl } from "@/lib/backend"

type Detail = MembershipRecord & {
  user: UserRecord
  audit: {
    id: string
    action: string
    actorId: string
    createdAt: string
    details: { reason?: string }
  }[]
}
const fieldClass = "grid gap-2 text-sm"
function localDate(value: string) {
  const d = new Date(value)
  return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 16)
}
export default function Admin() {
  const [me, setMe] = useState<MeResponse>()
  const [tab, setTab] = useState("memberships")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [semesters, setSemesters] = useState<SemesterRecord[]>([])
  const [editSemester, setEditSemester] = useState<SemesterRecord | null>(null)
  const [users, setUsers] = useState<PageResult<UserRecord>>()
  const [memberships, setMemberships] = useState<PageResult<MembershipRecord>>()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [editUser, setEditUser] = useState<UserRecord | null>(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [history, setHistory] = useState<MembershipRecord[]>([])
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  useEffect(() => {
    api<MeResponse>("users/me")
      .then(setMe)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])
  async function load() {
    if (!me?.isAdmin) return
    try {
      setLoading(true)
      const s = await api<SemesterRecord[]>("semesters")
      setSemesters(s)
      if (tab === "users")
        setUsers(
          await api<PageResult<UserRecord>>(`users?page=${page}${query}`)
        )
      if (tab === "memberships")
        setMemberships(
          await api<PageResult<MembershipRecord>>(
            `memberships?page=${page}${query}`
          )
        )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (!me?.isAdmin) return
    let active = true
    Promise.all([
      api<SemesterRecord[]>("semesters"),
      tab === "users"
        ? api<PageResult<UserRecord>>(`users?page=${page}${query}`)
        : Promise.resolve(undefined),
      tab === "memberships"
        ? api<PageResult<MembershipRecord>>(`memberships?page=${page}${query}`)
        : Promise.resolve(undefined),
    ])
      .then(([s, u, m]) => {
        if (active) {
          setSemesters(s)
          if (u) setUsers(u)
          if (m) setMemberships(m)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [me, tab, page, query])
  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError("")
    try {
      await fn()
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function openDetail(id: string) {
    await run(async () => setDetail(await api<Detail>(`memberships/${id}`)))
  }
  async function action(action: string, reason?: string, confirmed?: boolean) {
    if (!detail) return
    await run(async () => {
      await api(`memberships/${detail.id}/actions`, {
        action,
        reason,
        confirmed,
        version: detail.version,
      })
      setDetail(await api<Detail>(`memberships/${detail.id}`))
    })
  }
  function filter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const q = new URLSearchParams()
    for (const [k, v] of values) if (v) q.set(k, String(v))
    setPage(1)
    setQuery(`&${q}`)
  }
  function saveSemester(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const f = new FormData(event.currentTarget)
    const b: Record<string, unknown> = {}
    for (const [k, v] of f) b[k] = String(v)
    for (const key of [
      "newStartsAt",
      "newEndsAt",
      "returningStartsAt",
      "returningEndsAt",
    ])
      b[key] = new Date(`${b[key]}:00+09:00`).toISOString()
    b.newFee = Number(b.newFee)
    b.returningFee = Number(b.returningFee)
    b.isOpen = f.get("isOpen") === "on"
    void run(async () => {
      await api(
        editSemester ? `semesters/${editSemester.id}` : "semesters",
        b,
        editSemester ? "PATCH" : "POST"
      )
      setEditSemester(null)
    })
  }
  function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const b = profileFromForm(new FormData(event.currentTarget))
    void run(async () => {
      await api(
        editUser ? `users/${editUser.id}` : "users",
        b,
        editUser ? "PATCH" : "POST"
      )
      setShowUserForm(false)
      setEditUser(null)
    })
  }
  const result = tab === "users" ? users : memberships
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <a href="/studies" className="mb-4 block text-primary underline">
          스터디 관리
        </a>
        <h1 className="text-3xl font-bold">CoMit 부원 관리</h1>
        {me && (
          <form method="post" action={apiUrl("auth/logout")}>
            <Button type="submit" variant="outline">
              로그아웃
            </Button>
          </form>
        )}
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive p-4 text-destructive"
        >
          {error}
          <Button variant="ghost" onClick={() => void load()}>
            다시 불러오기
          </Button>
        </div>
      )}
      {loading && <p role="status">불러오는 중…</p>}
      {!me && !loading && (
        <Button render={<Link href="/login" />} nativeButton={false}>
          학교 계정으로 로그인
        </Button>
      )}
      {me && !me.isAdmin && (
        <p>관리자 권한이 없습니다. 운영진에게 문의해 주세요.</p>
      )}
      {me?.isAdmin && (
        <>
          <nav aria-label="관리 메뉴" className="flex flex-wrap gap-2">
            {[
              ["memberships", "가입·재등록 신청"],
              ["users", "부원 명부"],
              ["semesters", "학기 설정"],
            ].map(([key, label]) => (
              <Button
                key={key}
                variant={tab === key ? "default" : "outline"}
                onClick={() => {
                  setTab(key!)
                  setPage(1)
                  setQuery("")
                  setDetail(null)
                }}
              >
                {label}
              </Button>
            ))}
          </nav>
          {tab !== "semesters" && (
            <form
              onSubmit={filter}
              className="flex flex-wrap items-end gap-3"
              key={tab}
            >
              <label className={fieldClass}>
                이름·학번
                <Input name="search" />
              </label>
              {tab === "memberships" && (
                <>
                  <label className={fieldClass}>
                    학기
                    <select
                      className="h-10 rounded-md border bg-background px-3"
                      name="semesterId"
                    >
                      <option value="">전체</option>
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(
                    [
                      ["type", "신청 유형", ["NEW", "RETURNING"]],
                      [
                        "status",
                        "처리 상태",
                        [
                          "PENDING",
                          "CHANGES_REQUESTED",
                          "APPROVED",
                          "REJECTED",
                        ],
                      ],
                      ["payment", "입금 확인", ["true", "false"]],
                    ] as const
                  ).map(([name, label, options]) => (
                    <label key={name} className={fieldClass}>
                      {label}
                      <select
                        name={name}
                        className="h-10 rounded-md border bg-background px-3"
                      >
                        <option value="">전체</option>
                        {options.map((o) => (
                          <option key={o} value={o}>
                            {statusLabels[o] ??
                              (o === "true" ? "확인" : "미확인")}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </>
              )}
              <Button disabled={busy}>검색</Button>
            </form>
          )}
          {tab === "memberships" && (
            <>
              <div className="overflow-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="p-3">이름·학번</th>
                      <th>학기</th>
                      <th>유형·상태</th>
                      <th>입금·연결</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships?.items.map((m) => (
                      <tr className="border-b" key={m.id}>
                        <td className="p-3">
                          {m.profile.name}
                          <br />
                          {m.profile.studentId}
                        </td>
                        <td>{m.semester.name}</td>
                        <td>
                          {statusLabels[m.type]} · {statusLabels[m.status]}
                        </td>
                        <td>
                          {m.paymentConfirmed ? "입금 확인" : "입금 미확인"}
                          <br />
                          {m.linkConfirmed ? "연결 확인" : "연결 대기"}
                        </td>
                        <td>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void openDetail(m.id)}
                          >
                            상세
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!memberships?.items.length && !loading && (
                  <p className="p-6">신청이 없습니다.</p>
                )}
              </div>
              {detail && (
                <section className="space-y-4 rounded-xl border p-6">
                  <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">
                      {detail.profile.name} 신청 상세
                    </h2>
                    <Button variant="ghost" onClick={() => setDetail(null)}>
                      닫기
                    </Button>
                  </div>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(detail.profile).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted-foreground">
                          {(
                            {
                              name: "이름",
                              studentId: "학번",
                              department: "학과",
                              phone: "전화번호",
                              email: "학교 이메일",
                              birthDate: "생년월일",
                              academicStatus: "학적",
                              academicOther: "기타 학적",
                              campus: "캠퍼스",
                            } as Record<string, string>
                          )[k] ?? k}
                        </dt>
                        <dd>
                          {(
                            {
                              ENROLLED: "재학",
                              LEAVE: "휴학",
                              GRADUATED: "졸업",
                              OTHER: "기타",
                              NATURAL: "자연과학캠퍼스",
                              HUMANITIES: "인문사회캠퍼스",
                            } as Record<string, string>
                          )[String(v)] ?? String(v ?? "—")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p>
                    회비 {detail.fee.toLocaleString()}원 ·{" "}
                    {statusLabels[detail.status]}
                  </p>
                  {!detail.linkConfirmed && (
                    <p>
                      기존 명부: {detail.user.name} · {detail.user.studentId} ·{" "}
                      {detail.user.department} · {detail.user.phone}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {!detail.linkConfirmed && (
                      <Button
                        disabled={busy}
                        onClick={() => void action("CONFIRM_LINK")}
                      >
                        학번 확인 · 계정 연결
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void action(
                          "PAYMENT",
                          undefined,
                          !detail.paymentConfirmed
                        )
                      }
                    >
                      {detail.paymentConfirmed ? "입금 확인 취소" : "입금 확인"}
                    </Button>
                    {["PENDING", "CHANGES_REQUESTED"].includes(
                      detail.status
                    ) && (
                      <Button
                        disabled={
                          busy ||
                          !detail.linkConfirmed ||
                          !detail.paymentConfirmed
                        }
                        onClick={() => void action("APPROVE")}
                      >
                        승인
                      </Button>
                    )}
                  </div>
                  {["PENDING", "CHANGES_REQUESTED"].includes(detail.status) && (
                    <form
                      className="space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const f = new FormData(e.currentTarget)
                        void action(
                          String(f.get("action")),
                          String(f.get("reason"))
                        )
                      }}
                    >
                      <label className={fieldClass}>
                        처리 사유
                        <Textarea name="reason" required maxLength={2000} />
                      </label>
                      <select
                        name="action"
                        className="h-10 rounded border bg-background px-3"
                      >
                        <option value="REQUEST_CHANGES">보완 요청</option>
                        <option value="REJECT">반려</option>
                      </select>
                      <Button className="ml-3" disabled={busy}>
                        처리
                      </Button>
                    </form>
                  )}
                  <details>
                    <summary>신청 당시 동의문</summary>
                    <p className="whitespace-pre-wrap">{detail.consentText}</p>
                  </details>
                  <h3 className="font-semibold">처리 이력</h3>
                  {detail.audit.map((a) => (
                    <p key={a.id} className="text-sm">
                      {new Date(a.createdAt).toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}{" "}
                      · {a.action} · {a.actorId} {a.details.reason}
                    </p>
                  ))}
                </section>
              )}
            </>
          )}
          {tab === "users" && (
            <>
              <Button
                onClick={() => {
                  setEditUser(null)
                  setShowUserForm(true)
                  setHistory([])
                }}
              >
                부원 수동 등록
              </Button>
              <div className="overflow-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="p-3">이름·학번</th>
                      <th>학과</th>
                      <th>연락처</th>
                      <th>계정</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.items.map((u) => (
                      <tr key={u.id} className="border-b">
                        <td className="p-3">
                          {u.name}
                          <br />
                          {u.studentId}
                        </td>
                        <td>{u.department}</td>
                        <td>
                          {u.phone}
                          <br />
                          {u.email ?? "이메일 없음"}
                        </td>
                        <td>{u.authId ? "연결됨" : "미연결"}</td>
                        <td>
                          <Button
                            variant="outline"
                            onClick={() =>
                              void run(async () => {
                                setEditUser(u)
                                setShowUserForm(true)
                                setHistory(
                                  await api<MembershipRecord[]>(
                                    `users/${u.id}/memberships`
                                  )
                                )
                              })
                            }
                          >
                            수정·이력
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!users?.items.length && !loading && (
                  <p className="p-6">등록된 부원이 없습니다.</p>
                )}
              </div>
              {showUserForm && (
                <section className="space-y-4 rounded-xl border p-6">
                  <h2 className="text-xl font-semibold">
                    {editUser ? "부원 정보 수정" : "부원 등록"}
                  </h2>
                  <form
                    className="space-y-4"
                    onSubmit={saveUser}
                    key={editUser?.id ?? "new"}
                  >
                    <ProfileFields
                      value={editUser ?? undefined}
                      lockStudentId={Boolean(editUser)}
                    />
                    <Button disabled={busy}>저장</Button>
                    <Button
                      className="ml-2"
                      variant="outline"
                      type="button"
                      onClick={() => setShowUserForm(false)}
                    >
                      닫기
                    </Button>
                  </form>
                  {editUser && (
                    <>
                      <h3 className="font-semibold">과거 승인 이력</h3>
                      {history.map((m) => (
                        <p key={m.id}>
                          {m.semester.name} · {statusLabels[m.status]}
                        </p>
                      ))}
                      {!history.length && <p>이력이 없습니다.</p>}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          const f = new FormData(e.currentTarget)
                          void run(async () => {
                            await api("memberships/historical", {
                              userId: editUser.id,
                              semesterId: String(f.get("semesterId")),
                            })
                            setHistory(
                              await api<MembershipRecord[]>(
                                `users/${editUser.id}/memberships`
                              )
                            )
                          })
                        }}
                      >
                        <label className={fieldClass}>
                          과거 학기
                          <select
                            required
                            name="semesterId"
                            className="h-10 rounded border bg-background px-3"
                          >
                            <option value="">선택</option>
                            {semesters
                              .filter(
                                (s) =>
                                  !s.isCurrent &&
                                  new Date(s.newStartsAt) < new Date()
                              )
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                        </label>
                        <Button className="mt-3" disabled={busy}>
                          과거 승인 이력 등록
                        </Button>
                      </form>
                    </>
                  )}
                </section>
              )}
            </>
          )}
          {tab !== "semesters" && result && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                disabled={page === 1 || busy}
                onClick={() => setPage(page - 1)}
              >
                이전
              </Button>
              <span>
                {page}페이지 · 총 {result.total}건
              </span>
              <Button
                variant="outline"
                disabled={page * 20 >= result.total || busy}
                onClick={() => setPage(page + 1)}
              >
                다음
              </Button>
            </div>
          )}
          {tab === "semesters" && (
            <>
              <div className="grid gap-3">
                {semesters.map((s) => (
                  <article
                    key={s.id}
                    className="flex flex-wrap items-center gap-4 rounded-lg border p-4"
                  >
                    <h2 className="font-semibold">
                      {s.name}
                      {s.isCurrent ? " · 현재 운영 학기" : ""}
                    </h2>
                    <p>{s.isOpen ? "모집 열림" : "모집 닫힘"}</p>
                    <Button
                      variant="outline"
                      onClick={() => setEditSemester(s)}
                    >
                      수정
                    </Button>
                    {!s.isCurrent && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await api(`semesters/${s.id}/activate`, {})
                          })
                        }
                      >
                        현재 학기로 선택
                      </Button>
                    )}
                  </article>
                ))}
              </div>
              <section className="rounded-xl border p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {editSemester ? `${editSemester.name} 수정` : "학기 추가"}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setEditSemester(null)}
                  >
                    새 학기
                  </Button>
                </div>
                <form
                  onSubmit={saveSemester}
                  className="space-y-5"
                  key={editSemester?.id ?? "new"}
                >
                  <label className={fieldClass}>
                    학기 이름
                    <Input
                      name="name"
                      required
                      defaultValue={editSemester?.name}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        ["newStartsAt", "신규 모집 시작"],
                        ["newEndsAt", "신규 모집 종료"],
                        ["returningStartsAt", "재등록 모집 시작"],
                        ["returningEndsAt", "재등록 모집 종료"],
                      ] as const
                    ).map(([k, label]) => (
                      <label key={k} className={fieldClass}>
                        {label} (한국 시간)
                        <Input
                          name={k}
                          type="datetime-local"
                          required
                          defaultValue={
                            editSemester
                              ? localDate(editSemester[k])
                              : undefined
                          }
                        />
                      </label>
                    ))}
                    {(
                      [
                        ["newFee", "신규 회비"],
                        ["returningFee", "재등록 회비"],
                      ] as const
                    ).map(([k, label]) => (
                      <label key={k} className={fieldClass}>
                        {label}
                        <Input
                          name={k}
                          type="number"
                          min="0"
                          required
                          defaultValue={editSemester?.[k] ?? 0}
                        />
                      </label>
                    ))}
                  </div>
                  {(
                    [
                      ["bank", "은행명"],
                      ["accountNumber", "계좌번호"],
                      ["accountHolder", "예금주"],
                      ["consentVersion", "동의문 버전"],
                    ] as const
                  ).map(([k, label]) => (
                    <label className={fieldClass} key={k}>
                      {label}
                      <Input
                        name={k}
                        required
                        defaultValue={editSemester?.[k]}
                      />
                    </label>
                  ))}
                  <label className={fieldClass}>
                    개인정보 수집·이용 동의문
                    <Textarea
                      name="consentText"
                      rows={8}
                      defaultValue={editSemester?.consentText}
                    />
                  </label>
                  <label className="flex gap-2">
                    <input
                      type="checkbox"
                      name="isOpen"
                      defaultChecked={editSemester?.isOpen}
                    />
                    모집 열기
                  </label>
                  <Button disabled={busy}>학기 저장</Button>
                </form>
              </section>
            </>
          )}
        </>
      )}
    </main>
  )
}

"use client"

import { BookOpen, Users } from "lucide-react"
import { use, useEffect, useState } from "react"

import type { StudyManagementResponse } from "@comit/contracts"
import { Alert } from "@comit/ui/components/alert"
import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"
import { Field, FieldLabel } from "@comit/ui/components/field"
import { Input } from "@comit/ui/components/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@comit/ui/components/tabs"

import { StudyForm } from "@/components/study-form"
import {
  StudyBackLink,
  StudyEmpty,
  StudyError,
  StudyFormSkeleton,
  StudyStatusBadge,
} from "@/components/study-ui"
import { api } from "@/lib/api"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<StudyManagementResponse>()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [rejecting, setRejecting] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    api<StudyManagementResponse>(`studies/${id}/manage`)
      .then((r) => {
        if (active) {
          setData(r)
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
  }, [id, retry])
  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError("")
    try {
      await fn()
      setData(await api<StudyManagementResponse>(`studies/${id}/manage`))
      setRejecting(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <StudyBackLink href="/studies/mine">내 스터디</StudyBackLink>
      <p className="text-sm font-semibold text-primary">MANAGE STUDY</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        함께할 스터디를 관리해요.
      </h1>
      <p className="mt-3 text-muted-foreground">
        개설 내용을 확인하고 함께 배울 부원을 선발하세요.
      </p>
      {error && (
        <StudyError
          message={error}
          retry={() => {
            setLoading(true)
            setRetry(retry + 1)
          }}
        />
      )}
      {loading ? (
        <div className="mt-8">
          <StudyFormSkeleton />
        </div>
      ) : (
        data && (
          <div className="mt-8 space-y-8">
            <Card>
              <CardHeader>
                <div className="mb-2 flex flex-wrap gap-2">
                  <StudyStatusBadge status={data.study.status} />
                  <Badge>{data.study.semester.name}</Badge>
                  {!data.study.semester.isCurrent && <Badge>이전 학기</Badge>}
                </div>
                <CardTitle className="break-words">
                  {data.study.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Users aria-hidden className="size-4" />
                    {data.study.participantCount}/{data.study.capacity}명 참여
                    중 <span className="text-xs">(스터디장 포함)</span>
                  </p>
                  <p>
                    {
                      data.applications.filter((a) => a.status === "PENDING")
                        .length
                    }
                    건의 신청 대기
                  </p>
                </div>
                {data.study.reason && (
                  <Alert variant="warning" className="mt-4">
                    <div>
                      <p className="font-medium">개설 내용을 보완해 주세요</p>
                      <p className="mt-1">{data.study.reason}</p>
                    </div>
                  </Alert>
                )}
                {!data.study.semester.isCurrent && (
                  <Alert className="mt-4" role="status">
                    이전 학기 기록은 조회만 할 수 있어요.
                  </Alert>
                )}
              </CardContent>
            </Card>
            <Tabs defaultValue="applicants">
              <TabsList aria-label="스터디 관리 메뉴">
                <TabsTrigger value="applicants">
                  <Users aria-hidden className="mr-2 inline size-4" />
                  신청자 · 참여자
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <BookOpen aria-hidden className="mr-2 inline size-4" />
                  개설 정보
                </TabsTrigger>
              </TabsList>
              <TabsContent value="applicants">
                <div className="mt-2 mb-5">
                  <h2 className="text-xl font-semibold">신청자 · 참여자</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    참여 동기를 살펴보고 함께할 부원을 선발해요.
                  </p>
                </div>
                {!data.applications.length ? (
                  <StudyEmpty
                    title="아직 참여 신청이 없어요"
                    description={
                      data.study.status === "APPROVED"
                        ? "모집 기간에 신청한 부원이 이곳에 표시돼요."
                        : "개설 승인 후 모집 기간에 참여 신청을 받을 수 있어요."
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    {data.applications.map((a) => (
                      <Card key={a.id}>
                        <CardHeader>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold">
                              {a.user?.name}
                            </h3>
                            <StudyStatusBadge status={a.status} application />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {a.user?.studentId} · {a.user?.department}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-lg bg-muted/50 p-4">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                              참여 동기
                            </p>
                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                              {a.motivation}
                            </p>
                          </div>
                          {a.reason && (
                            <Alert variant="warning">{a.reason}</Alert>
                          )}
                          {data.study.semester.isCurrent && (
                            <div className="space-y-4">
                              {a.status === "PENDING" &&
                                data.study.status === "APPROVED" && (
                                  <>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        disabled={busy}
                                        loading={busy}
                                        onClick={() =>
                                          void run(() =>
                                            api(
                                              `studies/${id}/applications/${a.id}/actions`,
                                              {
                                                action: "APPROVE",
                                                version: a.version,
                                              }
                                            )
                                          )
                                        }
                                      >
                                        참여 승인
                                      </Button>
                                      <Button
                                        disabled={busy}
                                        variant="outline"
                                        onClick={() =>
                                          setRejecting(
                                            rejecting === a.id ? null : a.id
                                          )
                                        }
                                      >
                                        반려
                                      </Button>
                                    </div>
                                    {rejecting === a.id && (
                                      <div className="space-y-3 rounded-lg border p-4">
                                        <Field name={`reason-${a.id}`}>
                                          <FieldLabel>반려 사유</FieldLabel>
                                          <Input
                                            aria-label={`${a.user?.name} 반려 사유`}
                                            maxLength={2000}
                                            value={reasons[a.id] ?? ""}
                                            onValueChange={(value) =>
                                              setReasons({
                                                ...reasons,
                                                [a.id]: value,
                                              })
                                            }
                                            placeholder="신청자에게 안내할 사유를 적어 주세요."
                                          />
                                        </Field>
                                        <Button
                                          disabled={
                                            busy || !reasons[a.id]?.trim()
                                          }
                                          loading={busy}
                                          variant="destructive"
                                          onClick={() =>
                                            void run(() =>
                                              api(
                                                `studies/${id}/applications/${a.id}/actions`,
                                                {
                                                  action: "REJECT",
                                                  version: a.version,
                                                  reason: reasons[a.id],
                                                }
                                              )
                                            )
                                          }
                                        >
                                          반려 확정
                                        </Button>
                                      </div>
                                    )}
                                  </>
                                )}
                              {a.status === "APPROVED" && (
                                <Button
                                  disabled={busy}
                                  loading={busy}
                                  variant="outline"
                                  onClick={() =>
                                    void run(() =>
                                      api(
                                        `studies/${id}/applications/${a.id}/actions`,
                                        {
                                          action: "WITHDRAW",
                                          version: a.version,
                                        }
                                      )
                                    )
                                  }
                                >
                                  탈퇴 처리
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="settings">
                <div className="mt-2 space-y-6">
                  {data.study.semester.isCurrent ? (
                    <>
                      <Alert variant="info" role="note">
                        개설 내용을 수정하면 다시 관리자 승인을 받아요. 기존
                        신청·참여는 유지되며, 승인 전까지 새로운 신청을 받지
                        않습니다.
                      </Alert>
                      <StudyForm
                        key={data.study.version}
                        value={data.study}
                        busy={busy}
                        submitLabel="수정 · 재승인 요청"
                        onSubmit={(input) =>
                          void run(() =>
                            api(
                              `studies/${id}`,
                              { ...input, version: data.study.version },
                              "PATCH"
                            )
                          )
                        }
                      />
                    </>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>개설 정보</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {data.study.description}
                        </p>
                        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                          {[
                            ["참여 대상", data.study.audience],
                            ["진행 방식", data.study.format],
                            ["활동 일정", data.study.schedule],
                            ["장소", data.study.location],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <dt className="text-sm text-muted-foreground">
                                {label}
                              </dt>
                              <dd className="mt-1 text-sm font-medium">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )
      )}
    </section>
  )
}

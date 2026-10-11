"use client"

import { ArrowRight, BookOpen, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import type { MyStudiesResponse } from "@comit/contracts"
import { Alert } from "@comit/ui/components/alert"
import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"

import {
  StudyCardsSkeleton,
  StudyCreateButton,
  StudyEmpty,
  StudyError,
  StudyPage,
  StudyStatusBadge,
} from "@/components/study-ui"
import { api } from "@/lib/api"

export default function Page() {
  const [data, setData] = useState<MyStudiesResponse>()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    api<MyStudiesResponse>("studies/me")
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
  }, [retry])
  return (
    <StudyPage
      caption="MY STUDIES"
      title="함께하는 배움을 모아 봐요."
      description="내가 제안한 스터디와 참여 신청을 한곳에서 확인해요."
      actions={
        <>
          <Button
            variant="outline"
            render={<Link href="/studies" />}
            nativeButton={false}
          >
            스터디 둘러보기
          </Button>
          <StudyCreateButton />
        </>
      }
    >
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
        <div className="space-y-10">
          <div>
            <h2 className="mb-5 text-xl font-semibold">내가 개설한 스터디</h2>
            <StudyCardsSkeleton count={3} />
          </div>
          <div>
            <h2 className="mb-5 text-xl font-semibold">참여 신청</h2>
            <StudyCardsSkeleton count={3} />
          </div>
        </div>
      ) : (
        data && (
          <div className="space-y-12">
            <section>
              <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold">
                <BookOpen aria-hidden className="size-5 text-primary" />
                내가 개설한 스터디{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {data.studies.length}
                </span>
              </h2>
              {!data.studies.length ? (
                <StudyEmpty
                  title="아직 제안한 스터디가 없어요"
                  description="함께 공부하고 싶은 주제가 있다면 자율 스터디를 열어 보세요."
                >
                  <StudyCreateButton />
                </StudyEmpty>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {data.studies.map((s) => (
                    <Card key={s.id} className="flex min-w-0 flex-col">
                      <CardHeader>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <StudyStatusBadge status={s.status} />
                          {!s.semester.isCurrent && <Badge>이전 학기</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {s.semester.name}
                        </p>
                        <CardTitle className="break-words">{s.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users aria-hidden className="size-4" />
                          {s.participantCount}/{s.capacity}명 참여 중
                        </p>
                        {s.reason && (
                          <Alert variant="warning" className="mt-4">
                            {s.reason}
                          </Alert>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          className="w-full"
                          render={<Link href={`/studies/${s.id}/manage`} />}
                          nativeButton={false}
                        >
                          스터디 관리
                          <ArrowRight aria-hidden />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold">
                <Users aria-hidden className="size-5 text-primary" />
                참여 신청{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {data.applications.length}
                </span>
              </h2>
              {!data.applications.length ? (
                <StudyEmpty
                  title="아직 신청한 스터디가 없어요"
                  description="관심 있는 스터디를 살펴보고 함께 배울 기회를 찾아보세요."
                >
                  <Button
                    variant="outline"
                    render={<Link href="/studies" />}
                    nativeButton={false}
                  >
                    스터디 둘러보기
                  </Button>
                </StudyEmpty>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {data.applications.map((a) => (
                    <Card key={a.id} className="flex min-w-0 flex-col">
                      <CardHeader>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <StudyStatusBadge status={a.status} application />
                          {!a.study.semester.isCurrent && (
                            <Badge>이전 학기</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {a.study.semester.name}
                        </p>
                        <CardTitle className="break-words">
                          {a.study.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                          {a.motivation}
                        </p>
                        {a.reason && (
                          <Alert variant="warning" className="mt-4">
                            {a.reason}
                          </Alert>
                        )}
                      </CardContent>
                      <CardFooter className="flex-wrap">
                        {a.study.status === "APPROVED" && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            render={<Link href={`/studies/${a.studyId}`} />}
                            nativeButton={false}
                          >
                            상세 보기
                            <ArrowRight aria-hidden />
                          </Button>
                        )}
                        {a.status === "PENDING" &&
                          a.study.semester.isCurrent && (
                            <Button
                              disabled={busy !== null}
                              loading={busy === a.id}
                              variant="ghost"
                              onClick={async () => {
                                setBusy(a.id)
                                setError("")
                                try {
                                  await api(
                                    `studies/${a.studyId}/applications/${a.id}/actions`,
                                    { action: "CANCEL", version: a.version }
                                  )
                                  setData(
                                    await api<MyStudiesResponse>("studies/me")
                                  )
                                } catch (e) {
                                  setError((e as Error).message)
                                } finally {
                                  setBusy(null)
                                }
                              }}
                            >
                              신청 취소
                            </Button>
                          )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )
      )}
    </StudyPage>
  )
}

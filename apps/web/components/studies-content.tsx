"use client"

import { ArrowRight, BookOpen, Search, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import type { PageResult, StudyRecord } from "@comit/contracts"
import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"
import { Input } from "@comit/ui/components/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@comit/ui/components/pagination"

import {
  StudyCardsSkeleton,
  StudyCreateButton,
  StudyEmpty,
  StudyError,
  StudyPage,
} from "@/components/study-ui"
import { api } from "@/lib/api"

export function StudiesContent() {
  const [now, setNow] = useState(0)
  const [type, setType] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PageResult<StudyRecord>>()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      setLoading(true)
      setError("")
      setNow(Date.now())
      api<PageResult<StudyRecord>>(
        `studies?page=${page}&q=${encodeURIComponent(query)}${type ? `&type=${type}` : ""}`
      )
        .then((r) => {
          if (active) setResult(r)
        })
        .catch((e) => {
          if (active) setError(e.message)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 200)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [page, query, type, retry])
  function reset() {
    setQuery("")
    setType("")
    setPage(1)
    setLoading(true)
  }
  return (
    <StudyPage
      title="관심이 배움이 되는 곳."
      description="운영진이 구성하는 정규 스터디, 부원이 함께 여는 자율 스터디. 나에게 맞는 주제를 찾아 함께 배워 보세요."
      actions={
        <>
          <Button
            variant="outline"
            render={<Link href="/studies/mine" />}
            nativeButton={false}
          >
            <Users aria-hidden />내 스터디
          </Button>
          <StudyCreateButton />
        </>
      }
    >
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-2" role="group" aria-label="스터디 유형 필터">
          {[
            ["", "전체"],
            ["REGULAR", "정규"],
            ["AUTONOMOUS", "자율"],
          ].map(([value, label]) => (
            <Button
              key={value}
              aria-pressed={type === value}
              variant={type === value ? "default" : "outline"}
              onClick={() => {
                setType(value!)
                setPage(1)
                setLoading(true)
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="relative sm:w-80">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
          />
          <Input
            aria-label="스터디 검색"
            placeholder="관심 있는 주제를 검색해 보세요"
            value={query}
            onValueChange={(value) => {
              setQuery(value)
              setPage(1)
              setLoading(true)
            }}
            className="pl-9"
          />
        </div>
      </div>
      {loading ? (
        <StudyCardsSkeleton />
      ) : error ? (
        <StudyError
          message={error}
          retry={() => {
            setLoading(true)
            setRetry(retry + 1)
          }}
        />
      ) : !result?.items.length ? (
        <StudyEmpty
          title={
            query || type
              ? "검색 결과가 없어요"
              : "새로운 스터디를 준비하고 있어요"
          }
          description={
            query || type
              ? "다른 주제나 유형으로 찾아보세요."
              : "개설된 스터디가 공개되면 이곳에서 확인할 수 있어요. 관심 있는 주제가 있다면 직접 제안해 보세요."
          }
        >
          {query || type ? (
            <Button variant="outline" onClick={reset}>
              필터 초기화
            </Button>
          ) : (
            <StudyCreateButton />
          )}
        </StudyEmpty>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {result.total}개의 스터디
          </p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((s) => {
              const status =
                s.isLegacy || now >= Date.parse(s.endsAt)
                  ? "모집 종료"
                  : s.type === "REGULAR"
                    ? "정규 스터디 안내"
                    : now < Date.parse(s.startsAt)
                      ? "모집 예정"
                      : now >= Date.parse(s.endsAt)
                        ? "모집 종료"
                        : s.participantCount >= s.capacity
                          ? "정원 마감"
                          : "모집 중"
              return (
                <Card
                  key={s.id}
                  className="flex min-w-0 flex-col transition-colors hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span
                        aria-hidden
                        className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${s.type === "REGULAR" ? "bg-success-subtle text-success" : "bg-info-subtle text-info"}`}
                      >
                        {s.type === "REGULAR" ? (
                          <BookOpen className="size-6" />
                        ) : (
                          <Users className="size-6" />
                        )}
                      </span>
                      <Badge
                        variant={
                          status === "모집 중"
                            ? "success"
                            : status === "모집 예정"
                              ? "info"
                              : "default"
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={s.type === "REGULAR" ? "success" : "info"}
                      >
                        {s.type === "REGULAR" ? "정규 스터디" : "자율 스터디"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {s.semester.name}
                      </span>
                    </div>
                    <CardTitle className="break-words">
                      <Link
                        href={`/studies/${s.id}`}
                        className="rounded-sm transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {s.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-3 min-h-16 break-words whitespace-pre-wrap">
                      {s.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users aria-hidden className="size-4 shrink-0" />
                      <span>
                        {s.isLegacy
                          ? `정원 ${s.capacity}명`
                          : s.type === "AUTONOMOUS"
                            ? `${s.participantCount}/${s.capacity}명 참여 중`
                            : s.capacity === 0
                              ? "정원 제한 없음"
                              : `정원 ${s.capacity}명`}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {s.audience}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      render={<Link href={`/studies/${s.id}`} />}
                      nativeButton={false}
                      aria-label={`${s.title} 자세히 보기`}
                    >
                      자세히 보기
                      <ArrowRight aria-hidden />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
          {result.total > result.pageSize && (
            <Pagination className="mt-10" aria-label="스터디 페이지">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text="이전"
                    aria-label="이전 페이지"
                    href={`?page=${page - 1}`}
                    aria-disabled={page === 1}
                    tabIndex={page === 1 ? -1 : undefined}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault()
                      if (page > 1) {
                        setPage(page - 1)
                        setLoading(true)
                      }
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 text-sm text-muted-foreground">
                    {page} / {Math.ceil(result.total / result.pageSize)}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    text="다음"
                    aria-label="다음 페이지"
                    href={`?page=${page + 1}`}
                    aria-disabled={page * result.pageSize >= result.total}
                    tabIndex={
                      page * result.pageSize >= result.total ? -1 : undefined
                    }
                    className={
                      page * result.pageSize >= result.total
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(e) => {
                      e.preventDefault()
                      if (page * result.pageSize < result.total) {
                        setPage(page + 1)
                        setLoading(true)
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </StudyPage>
  )
}

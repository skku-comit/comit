"use client"

import { ArrowRight } from "lucide-react"
import { useState } from "react"

import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@comit/ui/components/dialog"
import { Input } from "@comit/ui/components/input"

const studies = [
  {
    title: "Python 기초",
    type: "정규",
    tag: "프로그래밍 입문",
    mark: "Py",
    text: "문법을 익히고 작은 실습을 함께 풀며 프로그래밍의 첫걸음을 시작해요.",
  },
  {
    title: "C 프로그래밍",
    type: "정규",
    tag: "프로그래밍 기초",
    mark: "C",
    text: "C의 기본 문법과 메모리 개념을 공부하며 컴퓨터의 동작을 이해해요.",
  },
  {
    title: "AI 함께 읽기",
    type: "자율",
    tag: "AI · 딥러닝",
    mark: "AI",
    text: "딥러닝과 AI 논문 등 관심 있는 주제를 골라 함께 읽고 생각을 나눠요.",
  },
]

export function StudiesContent() {
  const [filter, setFilter] = useState("전체")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<(typeof studies)[number] | null>(
    null
  )
  const visibleStudies = studies.filter(
    (study) =>
      (filter === "전체" || study.type === filter) &&
      `${study.title} ${study.tag}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <section id="studies" className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-semibold text-primary">STUDY TOGETHER</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            관심이 배움이 되는 곳.
          </h1>
          <p className="mt-3 text-muted-foreground">
            운영진이 구성하는 정규 스터디, 부원이 함께 여는 자율 스터디.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            아래는 활동 주제를 소개하는 예시입니다. 실제 학기별 개설 목록과 모집
            일정은 준비 중입니다.
          </p>
          <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row">
            <div className="flex gap-2" aria-label="스터디 유형 필터">
              {["전체", "정규", "자율"].map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? "default" : "outline"}
                  aria-pressed={filter === type}
                  onClick={() => setFilter(type)}
                >
                  {type === "전체" ? type : `${type} 스터디`}
                </Button>
              ))}
            </div>
            <Input
              aria-label="스터디 검색"
              placeholder="관심 있는 주제를 검색해 보세요"
              value={query}
              onValueChange={setQuery}
              className="sm:max-w-xs"
            />
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {visibleStudies.map((study) => (
              <Card key={study.title}>
                <CardHeader>
                  <div className="mb-5 flex items-center justify-between">
                    <span
                      className="flex size-14 items-center justify-center rounded-xl bg-success-subtle text-xl font-bold text-success"
                      aria-hidden
                    >
                      {study.mark}
                    </span>
                    <Badge>{study.type} 스터디</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{study.tag}</p>
                  <CardTitle>{study.title}</CardTitle>
                  <CardDescription>{study.text}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelected(study)}
                  >
                    자세히 보기 <ArrowRight aria-hidden />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {visibleStudies.length === 0 && (
            <p
              role="status"
              className="py-12 text-center text-muted-foreground"
            >
              검색 결과가 없습니다. 다른 주제나 유형으로 찾아보세요.
            </p>
          )}
        </div>
      </section>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent>
          <Badge>{selected?.type} 스터디 · 소개 예시</Badge>
          <DialogTitle>{selected?.title}</DialogTitle>
          <DialogDescription>{selected?.text}</DialogDescription>
          <p className="text-sm">
            {selected?.type === "정규"
              ? "운영진이 조를 구성하며 회차별 진행 담당자가 준비한 내용을 함께 공부하고 실습합니다."
              : "부원이 관심 있는 주제로 스터디를 제안하고 구성원과 함께 학습 방향을 정합니다."}
          </p>
          <p className="text-sm text-muted-foreground">
            실제 개설 여부와 신청 일정은 학기별 모집 공고에서 안내합니다.
          </p>
          <DialogClose>닫기</DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}

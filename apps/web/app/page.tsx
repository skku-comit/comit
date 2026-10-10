"use client"

import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Code2,
  Cpu,
  Users,
} from "lucide-react"
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

import { SiteHeader } from "@/components/site-header"

const activities = [
  {
    icon: BookOpen,
    title: "함께 배우는 스터디",
    text: "처음 쓰는 코드부터 AI 논문까지. 같은 관심사를 가진 사람들과 차근차근 배워요.",
    label: "STUDY",
  },
  {
    icon: Cpu,
    title: "AI와 만드는 새로운 경험",
    text: "에이전틱 코딩 세션에서 AI 도구를 익히고, 아이디어를 직접 구현해요.",
    label: "AI & BUILD",
  },
  {
    icon: Code2,
    title: "아이디어가 프로젝트로",
    text: "프로젝트와 해커톤에서 함께 고민하고 만들며 배운 것을 현실로 옮겨요.",
    label: "PROJECT",
  },
  {
    icon: Users,
    title: "코드 너머의 연결",
    text: "친목 활동부터 홈커밍 데이까지. 서로의 경험을 나누고 오래 이어지는 관계를 만들어요.",
    label: "COMMUNITY",
  },
]
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

export default function Page() {
  const [filter, setFilter] = useState("전체")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<(typeof studies)[number] | null>(
    null
  )
  const [loginOpen, setLoginOpen] = useState(false)
  const visibleStudies = studies.filter(
    (study) =>
      (filter === "전체" || study.type === filter) &&
      `${study.title} ${study.tag}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        본문으로 이동
      </a>
      <SiteHeader onLogin={() => setLoginOpen(true)} />
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div>
            <Badge variant="success">
              성균관대학교 중앙 프로그래밍 · AI 동아리
            </Badge>
            <h1 className="mt-7 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
              함께 배우고,
              <br />더 멀리 <span className="text-primary">만들어요.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              처음이어도 괜찮아요.
              <br />
              코딩과 AI에 대한 호기심이 있다면,
              <br />
              코밋에서 함께 시작해요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                render={<a href="#join" />}
                nativeButton={false}
                size="lg"
              >
                코밋과 함께하기 <ArrowRight aria-hidden />
              </Button>
              <Button
                render={<a href="#about" />}
                nativeButton={false}
                variant="outline"
                size="lg"
              >
                코밋 알아보기 <ArrowDown aria-hidden />
              </Button>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              전공도, 학년도, 실력도 달라도. 관심사는 같으니까.
            </p>
          </div>
          <div
            className="relative rounded-3xl border bg-success-subtle p-7 text-success sm:p-10"
            aria-label="배움과 공유, 성장을 표현한 코밋 그래픽"
          >
            <div className="flex justify-between text-xs font-semibold tracking-widest">
              <span>COMIT / SINCE 2019</span>
              <span>LEARN TOGETHER</span>
            </div>
            <div
              className="py-12 text-center text-7xl font-extrabold tracking-tighter sm:text-8xl"
              aria-hidden
            >
              {"{ co }"}
              <div className="mt-2 text-3xl tracking-normal">
                learn. share. build.
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-success/20 pt-5 text-center text-sm">
              <span>호기심</span>
              <span>지식 공유</span>
              <span>함께 성장</span>
            </div>
          </div>
        </section>
        <section id="about" className="scroll-mt-24 border-y bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-primary">ABOUT COMIT</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                다른 시작점,
                <br />
                같은 즐거움.
              </h2>
              <p className="mt-5 max-w-md text-muted-foreground">
                코밋은 성균관대학교 자연과학캠퍼스의 중앙 프로그래밍·AI
                동아리입니다. 다양한 사람들이 모여 자유롭게 지식을 나누고, 직접
                만들며 성장하는 공간을 추구합니다.
              </p>
              <div className="mt-6 flex gap-10">
                <div>
                  <p className="text-3xl font-bold">
                    2019
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      년
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">코밋의 시작</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    약 100
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      명
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    매 학기 함께하는 부원
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6 border-l pl-6">
              {[
                ["2019", "CoMit 창립", "함께 코딩을 배우는 모임의 시작"],
                [
                  "2023",
                  "중앙동아리로 한 걸음",
                  "중앙동아리 승격 · 명품 스터디클럽 선정 · MOD 협업",
                ],
                [
                  "2026",
                  "프로그래밍에서 AI까지",
                  "AI 리브랜딩 · SKYSH 해커톤 · 에이전틱 코딩 세션",
                ],
              ].map(([year, title, description]) => (
                <div key={year}>
                  <p className="text-sm font-bold text-primary">{year}</p>
                  <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          id="activities"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20"
        >
          <p className="text-sm font-semibold text-primary">OUR ACTIVITIES</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            코밋에서는 이렇게 함께해요.
          </h2>
          <p className="mt-3 text-muted-foreground">
            배움도, 도전도, 새로운 만남도.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {activities.map(({ icon: Icon, title, text, label }) => (
              <Card key={label}>
                <CardHeader>
                  <Icon className="mb-6 size-8 text-primary" aria-hidden />
                  <p className="text-xs font-semibold tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section id="studies" className="scroll-mt-24 border-y bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-sm font-semibold text-primary">STUDY TOGETHER</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              관심이 배움이 되는 곳.
            </h2>
            <p className="mt-3 text-muted-foreground">
              운영진이 구성하는 정규 스터디, 부원이 함께 여는 자율 스터디.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              아래는 활동 주제를 소개하는 예시입니다. 실제 학기별 개설 목록과
              모집 일정은 준비 중입니다.
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
        <section
          id="news"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16"
        >
          <p className="text-sm font-semibold text-primary">COMIT NEWS</p>
          <h2 className="mt-3 text-3xl font-bold">새로운 소식을 만나요.</h2>
          <div className="mt-6 rounded-xl border border-dashed p-8">
            <Badge>소식 준비 중</Badge>
            <p className="mt-3 text-muted-foreground">
              모집 공고와 학기별 활동 소식을 이곳에서 전할 예정입니다.
            </p>
          </div>
        </section>
        <section id="join" className="scroll-mt-24 bg-muted/50">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-primary">JOIN COMIT</p>
                <h2 className="mt-3 text-3xl font-bold">
                  다음 시작을 함께해요.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  처음 만나는 신규 부원도, 다시 함께하는 기존 부원도.
                  <br />
                  학교 구글 계정으로 가입과 재등록을 진행합니다.
                </p>
                <Badge variant="warning" className="mt-5">
                  온라인 신청 준비 중
                </Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  모집 기간·회비·납부 계좌는 운영진 확인 후 안내합니다.
                </p>
                <Button className="mt-6" onClick={() => setLoginOpen(true)}>
                  가입 · 재등록 안내 <ArrowRight aria-hidden />
                </Button>
              </div>
              <ol className="space-y-5">
                {[
                  [
                    "학교 구글 계정으로 로그인",
                    "학교 계정으로 본인을 확인해요.",
                  ],
                  [
                    "신규 가입 또는 재등록 신청",
                    "가입 정보를 작성하거나 기존 정보를 확인해요.",
                  ],
                  ["회비 납부", "안내된 계좌로 회비를 이체해요."],
                  [
                    "운영진 확인 후 활동 시작",
                    "입금 확인과 승인이 완료되면 부원 기능을 이용해요.",
                  ],
                ].map(([title, text], index) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-12 border-t pt-6">
              {[
                [
                  "코딩을 처음 배우는데 참여할 수 있나요?",
                  "네. 전공·학년·실력에 관계없이 코딩과 AI에 관심 있는 학생을 환영합니다.",
                ],
                [
                  "기존 부원도 매 학기 신청해야 하나요?",
                  "기존 계정으로 로그인한 뒤 해당 학기의 재등록을 신청합니다.",
                ],
                [
                  "신청하면 바로 부원 기능을 이용할 수 있나요?",
                  "운영진이 회비 입금을 확인하고 승인한 뒤 해당 학기의 부원 기능을 이용합니다.",
                ],
              ].map(([question, answer]) => (
                <details key={question} className="border-b py-4">
                  <summary className="cursor-pointer font-medium focus-visible:outline-ring">
                    {question}
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-6 py-10 sm:flex-row">
          <div>
            <p className="text-xl font-extrabold">
              CoMit<span className="text-primary">.</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              성균관대학교 자연과학캠퍼스
              <br />
              중앙 프로그래밍 · AI 동아리
            </p>
          </div>
          <p className="self-end text-xs text-muted-foreground">
            © {new Date().getFullYear()} CoMit. 함께 배우고 나누는 곳.
          </p>
        </div>
      </footer>
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
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogTitle>가입과 재등록 안내</DialogTitle>
          <DialogDescription>
            학교 구글 계정으로 로그인하고, 이번 학기 신청을 진행합니다.
          </DialogDescription>
          <Badge variant="warning">로그인 · 온라인 신청 준비 중</Badge>
          <p className="text-sm text-muted-foreground">
            현재는 가입 절차를 안내하는 화면입니다. 아직 로그인하거나 신청서를
            제출할 수 없습니다. 모집 일정과 회비는 운영진 확인 후 공개합니다.
          </p>
          <Button disabled>학교 구글 계정으로 로그인</Button>
          <DialogClose>닫기</DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}

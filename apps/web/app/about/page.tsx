import { BookOpen, Code2, Cpu, Users } from "lucide-react"
import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"

export const metadata: Metadata = {
  title: "코밋 소개 | CoMit",
  description: "코밋의 소개와 연혁, 스터디·AI·프로젝트·교류 활동을 알아보세요.",
}

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
export default function Page() {
  return (
    <>
      <section id="about" className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">ABOUT COMIT</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              다른 시작점,
              <br />
              같은 즐거움.
            </h1>
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
      <section id="activities" className="mx-auto max-w-6xl px-6 py-20">
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
    </>
  )
}

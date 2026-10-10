import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"

export const metadata: Metadata = {
  title: "함께 배우는 프로그래밍·AI 동아리 | CoMit",
  description: "성균관대학교 중앙 프로그래밍·AI 동아리 코밋을 만나보세요.",
}

export default function Page() {
  return (
    <>
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
              render={<Link href="/join" />}
              nativeButton={false}
              size="lg"
            >
              코밋과 함께하기 <ArrowRight aria-hidden />
            </Button>
            <Button
              render={<Link href="/about" />}
              nativeButton={false}
              variant="outline"
              size="lg"
            >
              코밋 알아보기 <ArrowRight aria-hidden />
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
    </>
  )
}

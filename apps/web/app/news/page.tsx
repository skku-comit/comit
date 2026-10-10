import type { Metadata } from "next"

import { Badge } from "@comit/ui/components/badge"

export const metadata: Metadata = {
  title: "소식 | CoMit",
  description: "코밋 모집 공고와 학기별 활동 소식을 안내합니다.",
}

export default function Page() {
  return (
    <>
      <section id="news" className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold text-primary">COMIT NEWS</p>
        <h1 className="mt-3 text-3xl font-bold">새로운 소식을 만나요.</h1>
        <div className="mt-6 rounded-xl border border-dashed p-8">
          <Badge>소식 준비 중</Badge>
          <p className="mt-3 text-muted-foreground">
            모집 공고와 학기별 활동 소식을 이곳에서 전할 예정입니다.
          </p>
        </div>
      </section>
    </>
  )
}

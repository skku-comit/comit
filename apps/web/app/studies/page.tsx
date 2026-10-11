import type { Metadata } from "next"

import { StudiesContent } from "@/components/studies-content"

export const metadata: Metadata = {
  title: "스터디 | CoMit",
  description: "학기별 정규·자율 스터디를 살펴보고 참여를 신청하세요.",
}

export default function Page() {
  return <StudiesContent />
}

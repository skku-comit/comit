import type { Metadata } from "next"

import { StudiesContent } from "@/components/studies-content"

export const metadata: Metadata = {
  title: "스터디 | CoMit",
  description: "정규·자율 스터디의 주제 예시를 검색하고 살펴보세요.",
}

export default function Page() {
  return <StudiesContent />
}

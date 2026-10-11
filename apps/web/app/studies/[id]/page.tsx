import { notFound } from "next/navigation"

import type { StudyRecord } from "@comit/contracts"

import { StudyDetail } from "@/components/study-detail"
import { StudyBackLink, StudyError } from "@/components/study-ui"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound()
  let response: Response | undefined
  let study: StudyRecord | undefined
  try {
    response = await fetch(
      `${process.env.API_URL ?? "http://127.0.0.1:3002"}/studies/${id}`,
      { cache: "no-store", signal: AbortSignal.timeout(15000) }
    )
    if (response.ok) study = (await response.json()) as StudyRecord
  } catch {
    /* The page displays connection errors below. */
  }
  if (response?.status === 404) notFound()
  if (!study)
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <StudyBackLink />
        <StudyError message="스터디를 불러오지 못했습니다. 잠시 후 새로고침해 주세요." />
      </section>
    )
  return <StudyDetail key={study.id} study={study} />
}

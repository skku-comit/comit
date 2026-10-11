"use client"

import { ClipboardCheck, Send, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import type { ManagedStudyRecord, MeResponse } from "@comit/contracts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"

import { StudyForm } from "@/components/study-form"
import { StudyBackLink, StudyError } from "@/components/study-ui"
import { api } from "@/lib/api"

export default function Page() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  useEffect(() => {
    let active = true
    api<MeResponse>("users/me")
      .then(() => {
        if (active) setAuthenticated(true)
      })
      .catch((e: Error) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [])
  if (!authenticated)
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        {error ? (
          <StudyError message={error} />
        ) : (
          <p role="status">불러오는 중…</p>
        )}
      </section>
    )
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <StudyBackLink />
      <p className="text-sm font-semibold text-primary">START A STUDY</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        함께 배울 주제를 제안해요.
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        관심 있는 주제로 자율 스터디를 열어 보세요. 현재 학기 승인 부원이
        제안하고, 관리자 확인을 거쳐 함께할 부원을 모집합니다.
      </p>
      {error && <StudyError message={error} />}
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <StudyForm
          busy={busy}
          submitLabel="개설 요청 제출"
          onSubmit={async (input) => {
            setBusy(true)
            setError("")
            try {
              const s = await api<ManagedStudyRecord>("studies", input)
              router.push(`/studies/${s.id}/manage`)
            } catch (e) {
              setError((e as Error).message)
              setBusy(false)
            }
          }}
        />
        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="text-lg">개설은 이렇게 진행돼요</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-6">
              {[
                [Send, "개설 요청", "학습 목표와 모집 계획을 작성해요."],
                [
                  ClipboardCheck,
                  "관리자 승인",
                  "제안 내용을 확인한 뒤 공개해요.",
                ],
                [Users, "참여자 모집", "신청한 부원을 스터디장가 선발해요."],
              ].map(([Icon, title, description], index) => {
                const ItemIcon = Icon as typeof Send
                return (
                  <li key={index} className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-subtle text-success">
                      <ItemIcon aria-hidden className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title as string}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {description as string}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

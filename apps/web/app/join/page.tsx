import type { Metadata } from "next"

import { Badge } from "@comit/ui/components/badge"

import { LoginButton } from "@/components/site-shell"

export const metadata: Metadata = {
  title: "가입 안내 | CoMit",
  description: "코밋 신규 가입과 재등록 절차, 자주 묻는 질문을 확인하세요.",
}

export default function Page() {
  return (
    <>
      <section id="join" className="bg-muted/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-primary">JOIN COMIT</p>
              <h1 className="mt-3 text-3xl font-bold">다음 시작을 함께해요.</h1>
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
              <LoginButton className="mt-6">가입 · 재등록 안내</LoginButton>
            </div>
            <ol className="space-y-5">
              {[
                ["학교 구글 계정으로 로그인", "학교 계정으로 본인을 확인해요."],
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
    </>
  )
}

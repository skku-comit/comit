"use client"

import { ArrowRight } from "lucide-react"
import { usePathname } from "next/navigation"
import { createContext, useContext, useState } from "react"

import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@comit/ui/components/dialog"

import { SiteHeader } from "@/components/site-header"

const LoginContext = createContext<(() => void) | null>(null)
export function LoginButton({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const openLogin = useContext(LoginContext)
  return (
    <Button className={className} onClick={() => openLogin?.()}>
      {children}
      <ArrowRight aria-hidden />
    </Button>
  )
}
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [loginOpen, setLoginOpen] = useState(false)
  return (
    <LoginContext.Provider value={() => setLoginOpen(true)}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        본문으로 이동
      </a>
      <SiteHeader key={pathname} onLogin={() => setLoginOpen(true)} />
      <main id="main" tabIndex={-1}>
        {children}
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
    </LoginContext.Provider>
  )
}

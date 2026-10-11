"use client"

import { ArrowRight, MapPin } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext } from "react"

import { Button } from "@comit/ui/components/button"

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
  const router = useRouter()
  return (
    <LoginContext.Provider value={() => router.push("/my")}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        본문으로 이동
      </a>
      <SiteHeader key={pathname} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xl font-extrabold">
              CoMit<span className="text-primary">.</span>
            </p>
            <nav
              aria-label="코밋 SNS"
              className="flex flex-wrap items-center gap-2 border-l pl-4"
            >
              <a
                href="https://www.instagram.com/skku_comit"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="인스타그램 (새 탭에서 열림)"
                title="인스타그램"
                className="inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#ffcc55] via-[#f04760] to-[#9438c5] text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
              <a
                href="https://open.kakao.com/o/sgjzGlKi"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="카카오톡 문의 (새 탭에서 열림)"
                title="카카오톡 문의"
                className="inline-flex size-9 items-center justify-center rounded-full bg-[#fee500] text-[#391b1b] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-7"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 3C6.48 3 2 6.46 2 10.73c0 2.77 1.88 5.2 4.7 6.56l-1.2 4.4c-.1.37.32.66.64.44l5.17-3.65c.23.01.46.02.69.02 5.52 0 10-3.46 10-7.77S17.52 3 12 3Z" />
                </svg>
              </a>
            </nav>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            성균관대학교 자연과학캠퍼스 중앙 프로그래밍 · AI 동아리
          </p>
          <address className="mt-4 space-y-3 text-sm leading-relaxed not-italic">
            <p className="flex items-start gap-2">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span>경기 수원시 장안구 서부로 2066 학생회관 3층 03312</span>
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <p className="flex gap-3">
                <span className="font-semibold">회장</span>
                <span>박상혁</span>
              </p>
              <p className="flex gap-3">
                <span className="font-semibold">부회장</span>
                <span>음서희</span>
              </p>
            </div>
          </address>
        </div>
        <div>
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p></p>
            <p>© {new Date().getFullYear()} CoMit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </LoginContext.Provider>
  )
}

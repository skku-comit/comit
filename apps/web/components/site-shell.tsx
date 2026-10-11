"use client"

import { ArrowRight } from "lucide-react"
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
    </LoginContext.Provider>
  )
}

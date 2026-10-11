"use client"

import { ChevronDown, Menu, UserRound, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@comit/ui/components/button"

import { useHeaderAccount } from "@/components/use-header-account"

const links = [
  ["스터디", "/studies"],
  ["세션", "/sessions"],
  ["프로젝트", "/projects"],
  ["소식", "/news"],
] as const
const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"

export function SiteHeader() {
  const { account, loading } = useHeaderAccount()
  const accountTrigger = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const mobileTrigger = useRef<HTMLButtonElement>(null)
  const close = () => {
    setOpenGroup(null)
    setMobileOpen(false)
  }

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        setOpenGroup(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener("pointerdown", outside)
    return () => document.removeEventListener("pointerdown", outside)
  }, [])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 bg-background/95 backdrop-blur"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (openGroup === "account") accountTrigger.current?.focus()
          else if (mobileOpen) mobileTrigger.current?.focus()
          close()
        }
      }}
    >
      <div className="relative mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 xl:grid xl:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          aria-label="CoMit 홈"
          aria-current={pathname === "/" ? "page" : undefined}
          onClick={close}
          className="w-fit rounded-md text-2xl font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-ring sm:text-[28px]"
        >
          CoMit<span className="text-primary">.</span>
        </Link>
        <nav aria-label="주 메뉴" className="hidden items-center gap-3 xl:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "page"
                  : undefined
              }
              onClick={close}
              className={linkClass}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2">
          {loading ? (
            <span
              role="status"
              className="h-10 w-28 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
            >
              <span className="sr-only">계정 확인 중</span>
            </span>
          ) : account ? (
            <div className="relative">
              <Button
                ref={accountTrigger}
                variant="outline"
                className="max-w-[120px] gap-2 sm:max-w-[220px]"
                aria-expanded={openGroup === "account"}
                aria-controls="header-account"
                onClick={() => {
                  setMobileOpen(false)
                  setOpenGroup(openGroup === "account" ? null : "account")
                }}
              >
                <UserRound aria-hidden className="size-4 shrink-0" />
                <span className="truncate">
                  {account.name ?? account.email}
                </span>
                <ChevronDown aria-hidden className="size-4 shrink-0" />
              </Button>
              {openGroup === "account" && (
                <div
                  id="header-account"
                  className="absolute top-full right-0 mt-2 w-[min(280px,calc(100vw-48px))] rounded-xl border bg-background p-3 shadow-lg"
                >
                  {account.name && (
                    <p className="px-3 pt-2 text-sm font-semibold break-all">
                      {account.name}
                    </p>
                  )}
                  <p className="px-3 py-2 text-sm break-all text-muted-foreground">
                    {account.email}
                  </p>
                  <Link
                    href="/my"
                    onClick={close}
                    aria-current={pathname === "/my" ? "page" : undefined}
                    className={`block ${linkClass}`}
                  >
                    내 활동
                  </Link>
                  <form action="/auth/logout" method="post">
                    <Button
                      type="submit"
                      variant="ghost"
                      className="mt-1 w-full justify-start"
                    >
                      로그아웃
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                render={
                  <Link
                    href="/join"
                    aria-current={pathname === "/join" ? "page" : undefined}
                  />
                }
                nativeButton={false}
                className="h-10 px-2 sm:px-3"
                onClick={close}
              >
                부원 가입
              </Button>
              <Button
                render={<Link href="/login" />}
                nativeButton={false}
                variant="ghost"
                className="h-10 px-2 sm:px-3"
                onClick={close}
              >
                로그인
              </Button>
            </>
          )}
          <Button
            ref={mobileTrigger}
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => {
              setOpenGroup(null)
              setMobileOpen(!mobileOpen)
            }}
          >
            {mobileOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="모바일 메뉴"
          className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t px-6 py-5 xl:hidden"
        >
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "page"
                  : undefined
              }
              onClick={close}
              className={`block ${linkClass}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

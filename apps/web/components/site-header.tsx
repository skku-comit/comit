"use client"

import { ChevronDown, Code2, Menu, Users, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@comit/ui/components/button"

const groups = [
  {
    label: "코밋 소개",
    caption: "ABOUT COMIT",
    items: [
      {
        label: "코밋 알아보기",
        description: "서로 다른 시작점에서 함께 성장하는 우리",
        href: "/about",
        icon: Users,
      },
      {
        label: "가입 안내",
        description: "코밋과 함께하는 첫걸음",
        href: "/join",
        icon: Code2,
      },
    ],
  },
] as const

const links = [
  ["스터디", "/studies"],
  ["소식", "/news"],
  ["내 활동", "/my"],
] as const
const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"

export function SiteHeader({ onLogin }: { onLogin: () => void }) {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const mobileTrigger = useRef<HTMLButtonElement>(null)
  const groupTriggers = useRef<Record<string, HTMLButtonElement | null>>({})
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
          if (openGroup) groupTriggers.current[openGroup]?.focus()
          else if (mobileOpen) mobileTrigger.current?.focus()
          close()
        }
      }}
    >
      <div className="relative mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          aria-label="CoMit 홈"
          aria-current={pathname === "/" ? "page" : undefined}
          onClick={close}
          className="w-fit rounded-md text-[28px] font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-ring"
        >
          CoMit<span className="text-primary">.</span>
        </Link>
        <nav aria-label="주 메뉴" className="hidden items-center gap-3 lg:flex">
          {groups.map((group) => (
            <div key={group.label}>
              <Button
                ref={(element) => {
                  groupTriggers.current[group.label] = element
                }}
                variant="ghost"
                className="h-10 gap-2 px-3"
                aria-expanded={openGroup === group.label}
                aria-controls={`header-${group.caption.replaceAll(" ", "-")}`}
                onClick={() =>
                  setOpenGroup(openGroup === group.label ? null : group.label)
                }
              >
                {group.label}
                <ChevronDown
                  aria-hidden
                  className={`size-4 transition-transform motion-reduce:transition-none ${openGroup === group.label ? "rotate-180" : ""}`}
                />
              </Button>
              {openGroup === group.label && (
                <div
                  id={`header-${group.caption.replaceAll(" ", "-")}`}
                  className="absolute top-[calc(100%-4px)] left-1/2 w-[600px] -translate-x-1/2 rounded-xl border bg-background p-6 shadow-lg"
                >
                  <p className="mb-4 text-xs font-medium tracking-wider text-muted-foreground">
                    {group.caption}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        aria-current={
                          pathname === item.href ? "page" : undefined
                        }
                        onClick={close}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          <item.icon aria-hidden className="size-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={close}
              className={linkClass}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            className="hidden sm:inline-flex"
            onClick={() => {
              close()
              onLogin()
            }}
          >
            로그인
          </Button>
          <Button
            render={
              <Link
                href="/join"
                aria-current={pathname === "/join" ? "page" : undefined}
              />
            }
            nativeButton={false}
            className="h-10 px-4"
            onClick={close}
          >
            가입 안내
          </Button>
          <Button
            ref={mobileTrigger}
            variant="ghost"
            size="icon"
            className="lg:hidden"
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
          className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t px-6 py-5 lg:hidden"
        >
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={close}
                  className="block rounded-lg px-3 py-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="block text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          ))}
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={close}
              className={`block ${linkClass}`}
            >
              {label}
            </Link>
          ))}
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              close()
              onLogin()
            }}
          >
            로그인
          </Button>
        </nav>
      )}
    </header>
  )
}

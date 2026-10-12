"use client"

import { useEffect, useState } from "react"

import type { MeResponse } from "@comit/contracts"

import { apiUrl } from "@/lib/backend"

export type HeaderAccount = { email: string; name?: string }

export function useHeaderAccount() {
  const [account, setAccount] = useState<HeaderAccount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let pending: AbortController | undefined
    const update = async () => {
      pending?.abort()
      const controller = new AbortController()
      pending = controller
      try {
        const response = await fetch(apiUrl("users/me"), {
          credentials: "include",
          signal: controller.signal,
          cache: "no-store",
        })
        const me: MeResponse | null = response.ok ? await response.json() : null
        if (active && !controller.signal.aborted)
          setAccount(
            me ? { email: me.email, name: me.user?.name || undefined } : null
          )
      } catch {
        // 일시적인 연결 실패 시 표시 중인 계정 정보를 유지한다.
      } finally {
        if (active && !controller.signal.aborted) setLoading(false)
      }
    }
    void update()
    const onFocus = () => {
      void update()
    }
    window.addEventListener("focus", onFocus)
    return () => {
      active = false
      pending?.abort()
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  return { account, loading }
}

"use client"

import { useEffect, useState } from "react"

import type { MeResponse } from "@comit/contracts"

import { supabaseBrowser } from "@/lib/supabase-browser"

export type HeaderAccount = { email: string; name?: string }

export function useHeaderAccount() {
  const [account, setAccount] = useState<HeaderAccount | null>(null)
  const [loading, setLoading] = useState(
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
  )

  useEffect(() => {
    const client = supabaseBrowser()
    if (!client) return
    let active = true
    let revision = 0
    let pending: AbortController | undefined
    const update = async (email?: string) => {
      const current = ++revision
      pending?.abort()
      if (!active) return
      setAccount(email ? { email } : null)
      setLoading(false)
      if (!email) return
      const controller = new AbortController()
      pending = controller
      try {
        const response = await fetch("/api/backend/users/me", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!response.ok) return
        const me: MeResponse = await response.json()
        if (active && current === revision)
          setAccount({ email, name: me.user?.name || undefined })
      } catch {
        // 인증된 계정의 이메일 표시를 유지한다.
      }
    }
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      void update(session?.user.email)
    })
    // INITIAL_SESSION을 포함한 인증 이벤트로 상태를 초기화한다.
    return () => {
      active = false
      revision++
      pending?.abort()
      data.subscription.unsubscribe()
    }
  }, [])

  return { account, loading }
}

import { NextRequest, NextResponse } from "next/server"

import { backend, setSession, siteOrigin, takeLoginState } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")
    const state = await takeLoginState()
    if (!code || !state) throw new Error("인증 정보가 없습니다.")
    const response = await backend("auth/callback", {
      method: "POST",
      body: JSON.stringify({
        code,
        state,
        origin: siteOrigin(),
      }),
    })
    if (!response.ok) throw new Error("로그인을 완료하지 못했습니다.")
    const { session } = await response.json()
    await setSession(session)
    return NextResponse.redirect(new URL("/", siteOrigin()))
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=1", process.env.SITE_URL ?? request.nextUrl.origin)
    )
  }
}

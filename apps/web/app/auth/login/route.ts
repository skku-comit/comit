import { NextResponse } from "next/server"

import { backend, setLoginState, siteOrigin } from "@/lib/session"

export async function GET() {
  try {
    const response = await backend("auth/login", {
      method: "POST",
      body: JSON.stringify({ origin: siteOrigin() }),
    })
    if (!response.ok) throw new Error("로그인을 시작하지 못했습니다.")
    const { url, state } = await response.json()
    await setLoginState(state)
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.json(
      { message: "로그인을 시작하지 못했습니다. 운영진에게 문의해 주세요." },
      { status: 503 }
    )
  }
}

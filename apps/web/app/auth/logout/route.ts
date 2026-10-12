import { NextRequest, NextResponse } from "next/server"

import { backend, clearSession, siteOrigin } from "@/lib/session"

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== siteOrigin())
    return NextResponse.json(
      { message: "허용되지 않은 요청입니다." },
      { status: 403 }
    )
  try {
    const response = await backend("auth/logout", {
      method: "POST",
      body: "{}",
    })
    if (!response.ok && response.status !== 401)
      throw new Error("로그아웃을 완료하지 못했습니다.")
    await clearSession()
    return NextResponse.redirect(new URL("/login", siteOrigin()), 303)
  } catch {
    return NextResponse.json(
      { message: "로그아웃을 완료하지 못했습니다. 다시 시도해 주세요." },
      { status: 503 }
    )
  }
}

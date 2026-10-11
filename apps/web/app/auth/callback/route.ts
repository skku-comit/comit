import { NextRequest, NextResponse } from "next/server"

import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  try {
    if (!code) throw new Error("인증 코드가 없습니다.")
    const client = await supabase()
    const { error } = await client.auth.exchangeCodeForSession(code)
    if (error) throw error
    const { data } = await client.auth.getUser()
    const email = data.user?.email?.toLowerCase()
    if (
      !email ||
      !["g.skku.edu", "skku.edu"].includes(email.split("@")[1] ?? "")
    ) {
      await client.auth.signOut()
      throw new Error("학교 계정을 사용해 주세요.")
    }
    return NextResponse.redirect(new URL("/my", process.env.SITE_URL!))
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=1", process.env.SITE_URL ?? request.nextUrl.origin)
    )
  }
}

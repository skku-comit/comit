import { NextResponse } from "next/server"

import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const origin = process.env.SITE_URL
    if (!origin) throw new Error("SITE_URL 설정이 필요합니다.")
    const client = await supabase()
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    })
    if (error || !data.url) throw new Error("로그인을 시작하지 못했습니다.")
    return NextResponse.redirect(data.url)
  } catch {
    return NextResponse.json(
      { message: "로그인을 시작하지 못했습니다. 운영진에게 문의해 주세요." },
      { status: 503 }
    )
  }
}

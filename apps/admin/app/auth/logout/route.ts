import { NextRequest, NextResponse } from "next/server"

import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(process.env.SITE_URL!).origin)
    return NextResponse.json(
      { message: "허용되지 않은 요청입니다." },
      { status: 403 }
    )
  const client = await supabase()
  await client.auth.signOut()
  return NextResponse.redirect(new URL("/login", process.env.SITE_URL!), 303)
}

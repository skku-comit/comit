import { NextRequest, NextResponse } from "next/server"

import { supabase } from "@/lib/supabase"

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params
    if (
      !["users", "memberships", "semesters", "studies"].includes(path[0] ?? "")
    )
      return NextResponse.json(
        { message: "잘못된 경로입니다." },
        { status: 404 }
      )
    if (
      request.method !== "GET" &&
      request.headers.get("origin") !== new URL(process.env.SITE_URL!).origin
    )
      return NextResponse.json(
        { message: "허용되지 않은 요청입니다." },
        { status: 403 }
      )
    const publicStudy =
      request.method === "GET" &&
      path[0] === "studies" &&
      (path.length === 1 ||
        (path.length === 2 && /^[0-9a-f-]{36}$/i.test(path[1] ?? "")))
    const client = publicStudy ? null : await supabase()
    const { data, error } = client
      ? await client.auth.getSession()
      : { data: { session: null }, error: null }
    if (!publicStudy && (error || !data.session))
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      )
    const upstream = await fetch(
      `${process.env.API_URL ?? "http://127.0.0.1:3002"}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers: {
          ...(data.session
            ? { Authorization: `Bearer ${data.session.access_token}` }
            : {}),
          "Content-Type": "application/json",
        },
        body: request.method === "GET" ? undefined : await request.text(),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    )
    const responseBody = await upstream.text()
    return new NextResponse(
      upstream.status === 204
        ? null
        : responseBody.trim()
          ? responseBody
          : "null",
      {
        status: upstream.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    )
  } catch {
    return NextResponse.json(
      { message: "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 }
    )
  }
}
export const GET = proxy
export const POST = proxy
export const PATCH = proxy

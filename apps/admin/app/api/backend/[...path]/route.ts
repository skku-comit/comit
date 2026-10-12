import { NextRequest, NextResponse } from "next/server"

import { backend, siteOrigin } from "@/lib/session"

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
      request.headers.get("origin") !== siteOrigin()
    )
      return NextResponse.json(
        { message: "허용되지 않은 요청입니다." },
        { status: 403 }
      )
    const upstream = await backend(
      `${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        body: request.method === "GET" ? undefined : await request.text(),
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

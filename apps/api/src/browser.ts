import { createHash } from "node:crypto"

import {
  BadRequestException,
  INestApplication,
  ServiceUnavailableException,
} from "@nestjs/common"

export interface BrowserRequest {
  method: string
  headers: Record<string, string | undefined>
}
export interface BrowserResponse {
  cookie(
    name: string,
    value: string,
    options: ReturnType<typeof cookieOptions> & { maxAge?: number }
  ): void
  clearCookie(name: string, options: ReturnType<typeof cookieOptions>): void
  setHeader(name: string, value: string): void
  redirect(status: number, url: string): void
}
export function apiOrigin() {
  const url =
    process.env.API_PUBLIC_URL ??
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3002")
  if (!url)
    throw new ServiceUnavailableException("API_PUBLIC_URL 설정이 필요합니다.")
  const origin = new URL(url).origin
  if (process.env.NODE_ENV === "production" && !origin.startsWith("https:"))
    throw new ServiceUnavailableException(
      "API_PUBLIC_URL은 HTTPS 주소여야 합니다."
    )
  return origin
}
export function allowedOrigins() {
  return (process.env.AUTH_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}
export function allowedOrigin(origin: string) {
  if (!allowedOrigins().includes(origin) || new URL(origin).origin !== origin)
    throw new BadRequestException("허용되지 않은 로그인 주소입니다.")
  return origin
}
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: apiOrigin().startsWith("https:"),
    sameSite: "lax" as const,
    path: "/",
  }
}
export function sessionCookie(origin: string) {
  const prefix = cookieOptions().secure ? "__Host-" : ""
  return `${prefix}comit-session-${createHash("sha256").update(origin).digest("hex").slice(0, 16)}`
}
export function loginCookie(id: string) {
  return `${cookieOptions().secure ? "__Host-" : ""}comit-login-${id}`
}
export function readCookie(request: BrowserRequest, name: string) {
  const value = request.headers.cookie
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1)
  try {
    return value ? decodeURIComponent(value) : undefined
  } catch {
    return undefined
  }
}
export function setSessionCookie(
  response: BrowserResponse,
  origin: string,
  value: string
) {
  response.cookie(sessionCookie(origin), value, {
    ...cookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}
export function setupBrowser(app: INestApplication) {
  app.enableCors({
    origin: allowedOrigins(),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
  app.use(
    (
      request: BrowserRequest,
      response: { status(code: number): { json(body: unknown): void } },
      next: () => void
    ) => {
      const origin = request.headers.origin
      const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method)
      if (
        (origin &&
          !allowedOrigins().includes(origin) &&
          origin !== apiOrigin()) ||
        (unsafe && request.headers.cookie && !origin)
      ) {
        response
          .status(403)
          .json({ statusCode: 403, message: "허용되지 않은 요청입니다." })
        return
      }
      next()
    }
  )
}

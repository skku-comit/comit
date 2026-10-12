import "server-only"

import { cookies } from "next/headers"

const sessionCookie = "comit-session"
const loginCookie = "comit-login"
const lifetime = 30 * 24 * 60 * 60

export function siteOrigin() {
  if (!process.env.SITE_URL) throw new Error("SITE_URL 설정이 필요합니다.")
  return new URL(process.env.SITE_URL).origin
}
export async function setSession(value: string) {
  const jar = await cookies()
  jar.set(sessionCookie, value, {
    httpOnly: true,
    secure: siteOrigin().startsWith("https:"),
    sameSite: "lax",
    path: "/",
    maxAge: lifetime,
  })
}
export async function clearSession() {
  const jar = await cookies()
  jar.delete(sessionCookie)
}
export async function setLoginState(value: string) {
  const jar = await cookies()
  jar.set(loginCookie, value, {
    httpOnly: true,
    secure: siteOrigin().startsWith("https:"),
    sameSite: "lax",
    path: "/auth",
    maxAge: 600,
  })
}
export async function takeLoginState() {
  const jar = await cookies()
  const value = jar.get(loginCookie)?.value
  jar.set(loginCookie, "", { path: "/auth", maxAge: 0 })
  return value
}
export async function backend(path: string, init?: RequestInit) {
  const jar = await cookies()
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  headers.set("x-comit-origin", siteOrigin())
  const session = jar.get(sessionCookie)?.value
  if (session) headers.set("x-comit-session", session)
  const response = await fetch(
    `${process.env.API_URL ?? "http://127.0.0.1:3002"}/${path}`,
    { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(15000) }
  )
  const renewed = response.headers.get("x-comit-session")
  if (renewed) await setSession(renewed)
  if (response.status === 401 && !path.startsWith("auth/")) await clearSession()
  return response
}

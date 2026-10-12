export function apiUrl(path: string) {
  const origin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"
  return `${origin.replace(/\/$/, "")}/${path}`
}
export function loginUrl() {
  const origin = process.env.SITE_URL
  if (!origin) throw new Error("SITE_URL 설정이 필요합니다.")
  return apiUrl(
    `auth/login?origin=${encodeURIComponent(new URL(origin).origin)}&destination=%2Fmy`
  )
}

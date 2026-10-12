import { apiUrl } from "./backend"

export async function api<T>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
  { redirectOnUnauthorized = true }: { redirectOnUnauthorized?: boolean } = {}
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    cache: "no-store",
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (response.status === 401 && redirectOnUnauthorized) {
    window.location.replace("/login")
    // 페이지 이동이 끝날 때까지 오류 UI와 후속 작업을 실행하지 않는다.
    return new Promise<T>(() => {})
  }
  const text = await response.text()
  let data
  try {
    data = text.trim() ? JSON.parse(text) : null
  } catch {
    throw new Error("서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.")
  }
  if (!response.ok) throw new Error(data?.message ?? "요청에 실패했습니다.")
  return data
}
export const statusLabels: Record<string, string> = {
  PENDING: "승인 대기",
  CHANGES_REQUESTED: "보완 요청",
  APPROVED: "승인 완료",
  REJECTED: "반려",
  NEW: "신규",
  RETURNING: "재등록",
}
export function koreanDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

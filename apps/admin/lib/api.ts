export async function api<T>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET"
): Promise<T> {
  const response = await fetch(`/api/backend/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
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

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error("Supabase 환경 설정이 필요합니다.")
  const jar = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return jar.getAll()
      },
      setAll(values) {
        for (const { name, value, options } of values)
          jar.set(name, value, options)
      },
    },
  })
}

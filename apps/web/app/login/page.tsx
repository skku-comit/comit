import { Button } from "@comit/ui/components/button"

import { loginUrl } from "@/lib/backend"

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const query = await searchParams
  return (
    <section className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-3xl font-bold">학교 계정으로 로그인</h1>
      <p className="my-6 text-muted-foreground">
        g.skku.edu 또는 skku.edu Google 계정을 사용해 주세요.
      </p>
      {query.error && (
        <p role="alert" className="mb-4 text-destructive">
          로그인에 실패했습니다. 학교 계정으로 다시 시도해 주세요.
        </p>
      )}
      <Button render={<a href={loginUrl()} />} nativeButton={false}>
        Google로 로그인
      </Button>
    </section>
  )
}

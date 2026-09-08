import { Button } from "@comit/ui/components/button"

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-start gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">comit</h1>
        <p className="text-muted-foreground">동아리 웹사이트</p>
        <Button>시작 화면</Button>
      </div>
    </main>
  )
}

import type { Meta, StoryObj } from "@storybook/react-vite"

const roles = [
  "background",
  "foreground",
  "card",
  "muted",
  "muted-foreground",
  "primary",
  "secondary",
  "border",
  "ring",
  "success",
  "warning",
  "info",
  "destructive",
]
function Foundations() {
  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold">코밋의 디자인 기반</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {roles.map((role) => (
          <div key={role} className="rounded-lg border p-3">
            <div
              className="mb-2 h-16 rounded border"
              style={{ background: `var(--${role})` }}
            />
            <code className="text-sm">{role}</code>
          </div>
        ))}
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">함께 배우고 나누는 코밋</h2>
        <p>전공과 실력에 관계없이 프로그래밍과 AI를 함께 배웁니다.</p>
        <p className="text-sm text-muted-foreground">
          설명과 보조 정보는 읽기 편한 대비를 유지합니다.
        </p>
      </section>
      <section className="space-y-3">
        {[4, 8, 12, 16, 24, 32, 48, 64].map((space) => (
          <div key={space} className="flex items-center gap-4">
            <span className="w-12 text-sm">{space}px</span>
            <div className="h-4 bg-primary" style={{ width: space }} />
          </div>
        ))}
      </section>
    </main>
  )
}
export default {
  title: "시작하기/토큰",
  component: Foundations,
} satisfies Meta<typeof Foundations>
export const Default: StoryObj<typeof Foundations> = {}

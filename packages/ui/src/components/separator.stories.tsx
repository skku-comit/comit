import type { Meta, StoryObj } from "@storybook/react-vite"

import { Separator } from "./separator"

const meta = {
  title: "컴포넌트/separator",
  component: Separator,
} satisfies Meta<typeof Separator>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <p className="font-semibold">스터디 소개</p>
      <Separator />
      <p className="text-sm text-muted-foreground">
        모집 안내와 진행 계획을 구분합니다.
      </p>
    </div>
  ),
}

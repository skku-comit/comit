import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"

const meta = { title: "컴포넌트/button", component: Button } satisfies Meta<
  typeof Button
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { args: { children: "가입 신청" } }
export const Loading: Story = { args: { children: "처리 중", loading: true } }
export const Disabled: Story = {
  args: { children: "모집 종료", disabled: true },
}
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(
        [
          "default",
          "secondary",
          "outline",
          "ghost",
          "destructive",
          "link",
        ] as const
      ).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

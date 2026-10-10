import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge } from "./badge"

const meta = { title: "컴포넌트/badge", component: Badge } satisfies Meta<
  typeof Badge
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default", "success", "warning", "info", "destructive"] as const).map(
        (variant, i) => (
          <Badge key={variant} variant={variant}>
            {["모집 종료", "승인 완료", "승인 대기", "안내", "반려"][i]}
          </Badge>
        )
      )}
    </div>
  ),
}

import type { Meta, StoryObj } from "@storybook/react-vite"

import { Skeleton } from "./skeleton"

const meta = { title: "컴포넌트/skeleton", component: Skeleton } satisfies Meta<
  typeof Skeleton
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <div
      role="status"
      aria-label="목록을 불러오는 중"
      className="flex flex-col gap-3"
    >
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <span className="sr-only">불러오는 중</span>
    </div>
  ),
}

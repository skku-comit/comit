import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "./empty-state"

const meta = {
  title: "컴포넌트/empty-state",
  component: EmptyState,
} satisfies Meta<typeof EmptyState>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <EmptyState>
      <EmptyStateTitle>아직 신청한 스터디가 없어요</EmptyStateTitle>
      <EmptyStateDescription>
        관심 있는 주제를 찾아 함께 시작해 보세요.
      </EmptyStateDescription>
    </EmptyState>
  ),
}

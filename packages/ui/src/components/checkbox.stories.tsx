import type { Meta, StoryObj } from "@storybook/react-vite"

import { Checkbox } from "./checkbox"

const meta = { title: "컴포넌트/checkbox", component: Checkbox } satisfies Meta<
  typeof Checkbox
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <label className="flex items-center gap-2">
      <Checkbox />
      개인정보 수집에 동의합니다
    </label>
  ),
}
export const Disabled: Story = {
  render: () => (
    <label className="flex items-center gap-2">
      <Checkbox disabled />
      변경할 수 없는 설정
    </label>
  ),
}

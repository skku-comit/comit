import type { Meta, StoryObj } from "@storybook/react-vite"

import { Switch } from "./switch"

const meta = { title: "컴포넌트/switch", component: Switch } satisfies Meta<
  typeof Switch
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <label className="flex items-center gap-2">
      <Switch />
      알림 받기
    </label>
  ),
}
export const Disabled: Story = {
  render: () => (
    <label className="flex items-center gap-2">
      <Switch disabled />
      변경할 수 없는 설정
    </label>
  ),
}

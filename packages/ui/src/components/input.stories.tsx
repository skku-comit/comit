import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"

const meta = { title: "컴포넌트/input", component: Input } satisfies Meta<
  typeof Input
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => <Input aria-label="이름" placeholder="이름을 입력하세요" />,
}
export const Invalid: Story = {
  args: {
    "aria-label": "오류 입력",
    "aria-invalid": true,
    defaultValue: "입력 내용을 확인해 주세요",
  },
}
export const Disabled: Story = {
  args: {
    "aria-label": "비활성 입력",
    disabled: true,
    placeholder: "수정할 수 없습니다",
  },
}

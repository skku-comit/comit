import type { Meta, StoryObj } from "@storybook/react-vite"

import { Textarea } from "./textarea"

const meta = { title: "컴포넌트/textarea", component: Textarea } satisfies Meta<
  typeof Textarea
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Textarea aria-label="자기소개" placeholder="관심 있는 분야를 알려주세요" />
  ),
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

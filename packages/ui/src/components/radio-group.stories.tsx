import type { Meta, StoryObj } from "@storybook/react-vite"

import { Radio, RadioGroup } from "./radio-group"

const meta = {
  title: "컴포넌트/radio-group",
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <RadioGroup aria-label="신청 유형" defaultValue="new">
      <label className="flex gap-2">
        <Radio value="new" />
        신규 가입
      </label>
      <label className="flex gap-2">
        <Radio value="renew" />
        재등록
      </label>
    </RadioGroup>
  ),
}

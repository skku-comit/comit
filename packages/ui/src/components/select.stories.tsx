import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "./select"

const meta = {
  title: "컴포넌트/select",
  component: SelectTrigger,
} satisfies Meta<typeof SelectTrigger>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Select
      items={[
        { label: "신규 가입", value: "new" },
        { label: "재등록", value: "renew" },
      ]}
      defaultValue="new"
    >
      <SelectTrigger aria-label="신청 유형">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="new">
          <SelectItemText>신규 가입</SelectItemText>
        </SelectItem>
        <SelectItem value="renew">
          <SelectItemText>재등록</SelectItemText>
        </SelectItem>
      </SelectContent>
    </Select>
  ),
}

import type { Meta, StoryObj } from "@storybook/react-vite"

import { Alert } from "./alert"

const meta = { title: "컴포넌트/alert", component: Alert } satisfies Meta<
  typeof Alert
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Alert variant="warning">
      주의: 신청 정보를 확인한 후 다시 제출해 주세요.
    </Alert>
  ),
}

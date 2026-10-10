import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card"

const meta = { title: "컴포넌트/card", component: Card } satisfies Meta<
  typeof Card
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>함께 배우는 코밋</CardTitle>
        <CardDescription>전공과 실력에 관계없이 시작하세요.</CardDescription>
      </CardHeader>
      <CardContent>이번 학기 스터디를 만나보세요.</CardContent>
    </Card>
  ),
}

import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

const meta = { title: "컴포넌트/tabs", component: Tabs } satisfies Meta<
  typeof Tabs
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="regular">
      <TabsList aria-label="스터디 종류">
        <TabsTrigger value="regular">정규 스터디</TabsTrigger>
        <TabsTrigger value="free">자율 스터디</TabsTrigger>
      </TabsList>
      <TabsContent value="regular">함께 시작하는 프로그래밍</TabsContent>
      <TabsContent value="free">자유롭게 제안하는 학습 주제</TabsContent>
    </Tabs>
  ),
}

export const KeyboardInteraction: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole("tab", { name: "정규 스터디" }).focus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(canvas.getByRole("tab", { name: "자율 스터디" })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() =>
      expect(
        canvas.getByRole("tabpanel", { name: "자율 스터디" })
      ).toHaveTextContent("자유롭게 제안하는 학습 주제")
    )
  },
}

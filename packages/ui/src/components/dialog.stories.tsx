import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Button } from "./button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { Input } from "./input"

const meta = { title: "컴포넌트/dialog", component: Dialog } satisfies Meta<
  typeof Dialog
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>신청 안내</DialogTrigger>
      <DialogContent>
        <DialogTitle>가입 신청 안내</DialogTitle>
        <DialogDescription>
          입금 확인 후 운영진이 신청을 승인합니다.
        </DialogDescription>
        <Input aria-label="입금자명" placeholder="입금자명" />
        <DialogClose render={<Button variant="outline" />}>닫기</DialogClose>
      </DialogContent>
    </Dialog>
  ),
}

export const KeyboardInteraction: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "신청 안내" })
    trigger.focus()
    await userEvent.keyboard("{Enter}")
    const body = within(canvasElement.ownerDocument.body)
    await expect(await body.findByRole("dialog")).toBeVisible()
    await expect(body.getByRole("textbox", { name: "입금자명" })).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await expect(trigger).toHaveFocus()
  },
}

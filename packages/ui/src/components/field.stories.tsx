import type { Meta, StoryObj } from "@storybook/react-vite"

import { Field, FieldDescription, FieldError, FieldLabel } from "./field"
import { Input } from "./input"

const meta = { title: "컴포넌트/field", component: Field } satisfies Meta<
  typeof Field
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Field invalid>
      <FieldLabel>이름</FieldLabel>
      <Input placeholder="이름" />
      <FieldDescription>실명을 입력하세요.</FieldDescription>
      <FieldError match>이름을 입력해 주세요.</FieldError>
    </Field>
  ),
}

import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

const meta = { title: "컴포넌트/table", component: Table } satisfies Meta<
  typeof Table
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>가입 신청 예시 · 가상 데이터</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>신청자</TableHead>
          <TableHead>신청 유형</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>김코밋</TableCell>
          <TableCell>신규 가입</TableCell>
          <TableCell>승인 대기</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

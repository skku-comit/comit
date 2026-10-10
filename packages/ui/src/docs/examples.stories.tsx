import type { Meta, StoryObj } from "@storybook/react-vite"

import { Alert } from "../components/alert"
import { Badge } from "../components/badge"
import { Button } from "../components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card"
import { Checkbox } from "../components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../components/field"
import { Input } from "../components/input"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/table"

function Registration({ invalid = false }: { invalid?: boolean }) {
  return (
    <form
      className="mx-auto flex max-w-lg flex-col gap-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <h1 className="text-2xl font-semibold">코밋 가입 신청</h1>
      <Alert variant="info">안내: 디자인 확인용 가상 양식입니다.</Alert>
      <Field invalid={invalid}>
        <FieldLabel>이름</FieldLabel>
        <Input required placeholder="홍길동" />
        <FieldDescription>
          입금 확인에 사용할 실명을 입력하세요.
        </FieldDescription>
        <FieldError match={invalid}>이름을 입력해 주세요.</FieldError>
      </Field>
      <Field>
        <FieldLabel>학교 이메일</FieldLabel>
        <Input type="email" placeholder="학교 이메일을 입력하세요" />
      </Field>
      <label className="flex items-start gap-2">
        <Checkbox />
        개인정보 수집 및 이용 안내를 확인했습니다.
      </label>
      <Button type="submit">가입 신청</Button>
    </form>
  )
}
function Studies() {
  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <h1 className="text-3xl font-semibold text-balance break-keep">
        함께 시작하는 이번 학기 스터디
      </h1>
      <div className="grid gap-6 md:grid-cols-2">
        {[
          "프로그래밍 첫걸음: 처음 시작하는 학생을 위한 파이썬 기초 스터디",
          "함께 만드는 AI 프로젝트",
        ].map((title) => (
          <Card key={title}>
            <CardHeader>
              <Badge variant="success" className="w-fit">
                모집 중
              </Badge>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                경험이 없어도 괜찮아요. 함께 배우고 나누며 성장해요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">스터디 살펴보기</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
function Applications() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">가입 신청 목록</h1>
      <Table>
        <TableCaption>신청 목록 · 가상 데이터</TableCaption>
        <TableHeader>
          <TableRow>
            {["신청자", "신청 유형", "학교 이메일", "입금", "승인 상태"].map(
              (label) => (
                <TableHead key={label}>{label}</TableHead>
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {["김코밋", "이프로그래밍"].map((name, i) => (
            <TableRow key={name}>
              <TableCell className="whitespace-nowrap">{name}</TableCell>
              <TableCell>신규 가입</TableCell>
              <TableCell>example-student@university.example</TableCell>
              <TableCell>{i ? "확인 완료" : "미확인"}</TableCell>
              <TableCell>
                <Badge variant={i ? "success" : "warning"}>
                  {i ? "승인 완료" : "승인 대기"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
export default {
  title: "조합 예제/화면",
  component: Registration,
} satisfies Meta<typeof Registration>
type Story = StoryObj<typeof Registration>
export const RegistrationForm: Story = {}
export const InvalidForm: Story = { args: { invalid: true } }
export const StudyList: Story = { render: () => <Studies /> }
export const AdminApplications: Story = { render: () => <Applications /> }

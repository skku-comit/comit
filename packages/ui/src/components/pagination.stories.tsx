import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination"

const meta = {
  title: "컴포넌트/pagination",
  component: Pagination,
} satisfies Meta<typeof Pagination>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Pagination aria-label="목록 페이지">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text="이전"
            aria-label="이전 페이지"
            href="#previous"
          />
        </PaginationItem>
        {[1, 2, 3].map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href={`#page-${page}`}
              isActive={page === 2}
              aria-label={`${page} 페이지`}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext text="다음" aria-label="다음 페이지" href="#next" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
}

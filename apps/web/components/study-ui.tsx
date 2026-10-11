import { ArrowLeft, BookOpen, CircleAlert, Plus } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Alert } from "@comit/ui/components/alert"
import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"
import { Card, CardContent, CardHeader } from "@comit/ui/components/card"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@comit/ui/components/empty-state"
import { Skeleton } from "@comit/ui/components/skeleton"

export function StudyBackLink({
  href = "/studies",
  children = "스터디 목록",
}: {
  href?: string
  children?: ReactNode
}) {
  return (
    <Button
      render={<Link href={href} />}
      nativeButton={false}
      variant="ghost"
      className="mb-6 -ml-2"
    >
      <ArrowLeft aria-hidden />
      {children}
    </Button>
  )
}
export function StudyPage({
  title,
  description,
  caption = "STUDY TOGETHER",
  actions,
  children,
}: {
  title: string
  description: string
  caption?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">{caption}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight break-words">
            {title}
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
export function StudyCreateButton() {
  return (
    <Button render={<Link href="/studies/new" />} nativeButton={false}>
      <Plus aria-hidden />
      자율 스터디 개설
    </Button>
  )
}
export function StudyStatusBadge({
  status,
  application = false,
}: {
  status: string
  application?: boolean
}) {
  const labels: Record<string, string> = {
    PENDING: application ? "선발 대기" : "개설 승인 대기",
    APPROVED: application ? "참여 승인" : "개설 승인",
    REJECTED: "반려",
    CANCELLED: "신청 취소",
    WITHDRAWN: "탈퇴",
  }
  return (
    <Badge
      variant={
        status === "APPROVED"
          ? "success"
          : status === "PENDING"
            ? "warning"
            : status === "REJECTED"
              ? "destructive"
              : "default"
      }
    >
      {labels[status] ?? status}
    </Badge>
  )
}
export function StudyError({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  return (
    <Alert variant="destructive" className="my-6">
      <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">요청을 처리하지 못했어요</p>
        <p className="mt-1 break-words">{message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {retry && (
            <Button variant="outline" size="sm" onClick={retry}>
              다시 불러오기
            </Button>
          )}
          {message.includes("로그인") && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              로그인
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}
export function StudyEmpty({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <EmptyState className="bg-card py-12">
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-xl bg-success-subtle text-success"
      >
        <BookOpen className="size-6" />
      </span>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      <EmptyStateDescription>{description}</EmptyStateDescription>
      {children && <div className="mt-2">{children}</div>}
    </EmptyState>
  )
}
function LoadingRegion({
  label,
  children,
  className = "",
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}
export function StudyCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <LoadingRegion label="스터디 목록을 불러오는 중">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="size-12 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-5 h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </LoadingRegion>
  )
}
export function StudyFormSkeleton() {
  return (
    <LoadingRegion label="스터디 정보를 불러오는 중">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    </LoadingRegion>
  )
}
export function StudyDetailSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <LoadingRegion label="스터디 상세를 불러오는 중">
        <Skeleton className="mb-8 h-9 w-32" />
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="mt-4 h-10 w-2/3 max-w-lg" />
        <Skeleton className="mt-4 h-4 w-48" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
              <Skeleton className="mt-8 h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </div>
      </LoadingRegion>
    </section>
  )
}
export function StudyParticipationSkeleton() {
  return (
    <LoadingRegion label="내 참여 상태를 확인하는 중">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </LoadingRegion>
  )
}

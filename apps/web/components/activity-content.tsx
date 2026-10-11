import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Badge } from "@comit/ui/components/badge"
import { Button } from "@comit/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@comit/ui/components/card"

import {
  activitySections,
  type ActivityKind,
  type ProjectContent,
  type SessionContent,
} from "@/lib/activities"

function ActivityFacts({ item }: { item: SessionContent | ProjectContent }) {
  return (
    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
      {"schedule" in item && item.schedule && (
        <span>일정: {item.schedule}</span>
      )}
      {"location" in item && item.location && (
        <span>장소: {item.location}</span>
      )}
      {"status" in item && item.status && <Badge>{item.status}</Badge>}
      {"tags" in item &&
        item.tags?.map((tag) => (
          <Badge key={tag} variant="info">
            {tag}
          </Badge>
        ))}
    </div>
  )
}

export function ActivityList({ kind }: { kind: ActivityKind }) {
  const section = activitySections[kind]
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-semibold text-primary">{section.caption}</p>
      <h1 className="mt-3 text-3xl font-bold">{section.title}</h1>
      <p className="mt-3 text-muted-foreground">{section.description}</p>
      {section.items.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item) => (
            <Card key={item.slug}>
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/${kind}/${item.slug}`}
                    className="rounded-md hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {item.title}
                  </Link>
                </CardTitle>
                <CardDescription>{item.summary}</CardDescription>
                <ActivityFacts item={item} />
                <Link
                  href={`/${kind}/${item.slug}`}
                  className="mt-3 inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-ring"
                  aria-label={`${item.title} 자세히 보기`}
                >
                  자세히 보기 <ArrowRight aria-hidden className="size-4" />
                </Link>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed p-8">
          <Badge>
            {kind === "sessions" ? "세션 준비 중" : "프로젝트 준비 중"}
          </Badge>
          <p className="mt-3 text-muted-foreground">{section.empty}</p>
        </div>
      )}
    </section>
  )
}

export function ActivityDetail({
  kind,
  item,
}: {
  kind: ActivityKind
  item: SessionContent | ProjectContent
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Button
        render={<Link href={`/${kind}`} />}
        nativeButton={false}
        variant="ghost"
        className="mb-8"
      >
        <ArrowLeft aria-hidden />
        {activitySections[kind].title} 목록
      </Button>
      <p className="text-sm font-semibold text-primary">
        {activitySections[kind].caption}
      </p>
      <h1 className="mt-3 text-3xl font-bold break-words">{item.title}</h1>
      <p className="mt-4 text-muted-foreground">{item.summary}</p>
      <div className="mt-5">
        <ActivityFacts item={item} />
      </div>
      <div className="mt-8 space-y-5 leading-relaxed">
        {item.paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
      {!!item.links?.length && (
        <section className="mt-10 border-t pt-6">
          <h2 className="text-lg font-semibold">관련 링크</h2>
          <ul className="mt-3 space-y-3">
            {item.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-md text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

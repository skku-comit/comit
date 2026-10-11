import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ActivityDetail } from "@/components/activity-content"
import { sessions } from "@/lib/activities"

type Props = { params: Promise<{ slug: string }> }

async function getItem(params: Props["params"]) {
  const { slug } = await params
  const item = sessions.find((item) => item.slug === slug)
  if (!item) notFound()
  return item
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem(params)
  return { title: `${item.title} | CoMit`, description: item.summary }
}

export default async function Page({ params }: Props) {
  const item = await getItem(params)
  return <ActivityDetail kind="sessions" item={item} />
}

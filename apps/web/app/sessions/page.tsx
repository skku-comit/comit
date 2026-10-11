import type { Metadata } from "next"

import { ActivityList } from "@/components/activity-content"
import { activitySections } from "@/lib/activities"

export const metadata: Metadata = {
  title: `${activitySections.sessions.title} | CoMit`,
  description: activitySections.sessions.description,
}

export default function Page() {
  return <ActivityList kind="sessions" />
}

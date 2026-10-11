import type { Metadata } from "next"

import { ActivityList } from "@/components/activity-content"
import { activitySections } from "@/lib/activities"

export const metadata: Metadata = {
  title: `${activitySections.projects.title} | CoMit`,
  description: activitySections.projects.description,
}

export default function Page() {
  return <ActivityList kind="projects" />
}

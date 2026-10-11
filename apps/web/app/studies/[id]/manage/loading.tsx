import { StudyBackLink, StudyFormSkeleton } from "@/components/study-ui"

export default function Loading() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <StudyBackLink href="/studies/mine">내 스터디</StudyBackLink>
      <div className="mt-8">
        <StudyFormSkeleton />
      </div>
    </section>
  )
}

require("dotenv").config({ quiet: true })
const console = require("node:console")
const { PrismaClient, Prisma } = require("@prisma/client")
const db = new PrismaClient()
async function main() {
  const result = await db.$transaction(
    async (tx) => {
      const semester = await tx.semester.findUniqueOrThrow({
        where: { name: "2026년 2학기" },
      })
      const existing = await tx.study.findFirst({
        where: {
          semesterId: semester.id,
          type: "AUTONOMOUS",
          title: "의료인공지능",
        },
      })
      if (existing) return { id: existing.id, created: false }
      const study = await tx.study.create({
        data: {
          semesterId: semester.id,
          type: "AUTONOMOUS",
          status: "APPROVED",
          isLegacy: true,
          title: "의료인공지능",
          description:
            "의료인공지능 논문 기반 구현, 차후 공모전에 접수하여 프로젝트 제출을 목표로 하는 스터디입니다. 매주 온라인으로 논문 구현 발표 또는 공모전 회의를 진행하게 됩니다.\n\n난이도: 5/5\n신청이 마감된 기존 운영 스터디입니다.",
          audience: "필요한 선행 지식과 참여 대상은 추후 안내합니다.",
          format: "온라인 논문 구현 발표 또는 공모전 회의",
          schedule: "매주 온라인 진행 (모집 인원과 상의 후 결정)",
          location: "온라인",
          capacity: 5,
          resourceUrl: null,
          // Required legacy schema fields; unknown historical dates are never shown.
          startsAt: new Date(0),
          endsAt: new Date(0),
          representativeId: null,
        },
      })
      await tx.auditLog.create({
        data: {
          actorId: "user-authorized-import",
          entity: "Study",
          entityId: study.id,
          action: "CREATE",
          details: {
            source: "user-provided medical AI study image",
            isLegacy: true,
            recruitmentClosed: true,
            historicalDatesUnknown: true,
            leaderAccountUnlinked: true,
          },
        },
      })
      return {
        id: study.id,
        created: true,
        semester: semester.name,
        title: study.title,
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000,
    }
  )
  console.log(JSON.stringify(result))
}
main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())

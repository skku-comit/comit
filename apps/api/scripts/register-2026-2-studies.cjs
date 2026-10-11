// User-confirmed real regular studies. Run explicitly; never included in migrations.
require("dotenv").config({ quiet: true })
const { PrismaClient, Prisma } = require("@prisma/client")
const console = require("node:console")
const db = new PrismaClient()
const titles = [
  "C 기초",
  "Python 기초",
  "AI 기초",
  "데이터분석과AI기초(DS)",
  "프로그래밍기초와실습(DS)",
]
async function main() {
  const result = await db.$transaction(
    async (tx) => {
      const current = await tx.semester.findFirst({
        where: { isCurrent: true },
      })
      if (!current) throw new Error("복사할 기존 학기 운영 설정이 없습니다.")
      let semester = await tx.semester.findUnique({
        where: { name: "2026년 2학기" },
      })
      if (!semester) {
        // Preserve existing member registration settings but keep registration closed.
        const settings = { ...current }
        for (const key of ["id", "name", "createdAt", "isCurrent", "isOpen"])
          delete settings[key]
        semester = await tx.semester.create({
          data: {
            ...settings,
            name: "2026년 2학기",
            isCurrent: false,
            isOpen: false,
          },
        })
        await tx.auditLog.create({
          data: {
            actorId: "user-authorized-import",
            entity: "Semester",
            entityId: semester.id,
            action: "CREATE",
            details: {
              source: "user request",
              copiedSettingsFrom: current.id,
              isOpen: false,
            },
          },
        })
      }
      await tx.semester.updateMany({
        where: { isCurrent: true, id: { not: semester.id } },
        data: { isCurrent: false },
      })
      await tx.semester.update({
        where: { id: semester.id },
        data: { isCurrent: true },
      })
      await tx.auditLog.create({
        data: {
          actorId: "user-authorized-import",
          entity: "Semester",
          entityId: semester.id,
          action: "ACTIVATE",
          details: { previousSemesterId: current.id },
        },
      })
      let created = 0
      for (const title of titles) {
        if (
          await tx.study.findFirst({
            where: { semesterId: semester.id, type: "REGULAR", title },
          })
        )
          continue
        const study = await tx.study.create({
          data: {
            semesterId: semester.id,
            type: "REGULAR",
            status: "APPROVED",
            title,
            description:
              "2026년 2학기 정규 스터디입니다. 정원 제한 없이 신청 인원을 확인한 뒤 운영진이 적절하게 팀을 구성합니다. 세부 커리큘럼과 진행 일정은 추후 안내합니다.",
            audience: "참여 대상은 추후 안내합니다.",
            format: "신청 인원에 따라 운영진이 팀을 구성합니다.",
            schedule: "추후 안내",
            location: "추후 안내",
            resourceUrl: null,
            startsAt: new Date("2026-09-01T00:00:00+09:00"),
            endsAt: new Date("2026-09-04T23:59:59.999+09:00"),
            capacity: 0,
          },
        })
        await tx.auditLog.create({
          data: {
            actorId: "user-authorized-import",
            entity: "Study",
            entityId: study.id,
            action: "CREATE",
            details: {
              source: "user-provided study image and recruitment dates",
              type: "REGULAR",
              title,
            },
          },
        })
        created++
      }
      return {
        semester: semester.name,
        semesterId: semester.id,
        created,
        titles,
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000,
    }
  )
  console.log(JSON.stringify(result, null, 2))
}
main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())

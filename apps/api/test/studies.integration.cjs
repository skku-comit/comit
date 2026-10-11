const assert = require("node:assert/strict")
const { randomUUID } = require("node:crypto")
const { test } = require("node:test")
require("./typescript.cjs")
const { Database } = require("../src/database.ts")
const { StudiesService } = require("../src/studies.ts")
const { SemestersService } = require("../src/semesters.ts")
const url = process.env.TEST_DATABASE_URL
// Explicit isolated database only; never fall back to production settings.
test(
  "PostgreSQL study approval, selection and privacy",
  { skip: !url },
  async (t) => {
    const db = new Database({ datasources: { db: { url } } })
    const service = new StudiesService(db)
    const semesters = new SemestersService(db)
    const admin = { id: randomUUID(), email: "admin@g.skku.edu", isAdmin: true }
    const actors = Array.from({ length: 4 }, () => ({
      id: randomUUID(),
      email: "test@g.skku.edu",
      isAdmin: false,
    }))
    const userIds = [],
      studyIds = [],
      semesterIds = []
    const now = Date.now()
    const settings = {
      name: `study-${randomUUID()}`,
      newStartsAt: new Date(now - 60000).toISOString(),
      newEndsAt: new Date(now + 3600000).toISOString(),
      returningStartsAt: new Date(now - 60000).toISOString(),
      returningEndsAt: new Date(now + 3600000).toISOString(),
      newFee: 0,
      returningFee: 0,
      bank: "test",
      accountNumber: "test",
      accountHolder: "test",
      consentText: "test",
      consentVersion: "v1",
      isOpen: false,
    }
    const input = {
      title: "테스트 스터디",
      description: "학습 계획",
      audience: "부원",
      format: "온라인",
      schedule: "매주",
      location: "온라인",
      resourceUrl: null,
      startsAt: new Date(now - 60000).toISOString(),
      endsAt: new Date(now + 3600000).toISOString(),
      capacity: 2,
    }
    let semester, study, applications
    const review = (s, action, reason) =>
      service.review(admin, s.id, { action, reason, version: s.version })
    const action = (actor, a, type, reason) =>
      service.applicationAction(actor, study.id, a.id, {
        action: type,
        version: a.version,
        reason,
      })
    try {
      semester = await semesters.save(admin, settings)
      semesterIds.push(semester.id)
      await semesters.activate(admin, semester.id)
      for (const [index, actor] of actors.entries()) {
        const user = await db.user.create({
          data: {
            authId: actor.id,
            name: `테스트${index}`,
            studentId: `${Date.now()}${index}`,
            department: "컴퓨터",
            phone: "01012345678",
            birthDate: new Date("2000-01-01"),
            academicStatus: "ENROLLED",
            campus: "NATURAL",
          },
        })
        userIds.push(user.id)
        await db.membership.create({
          data: {
            userId: user.id,
            semesterId: semester.id,
            type: "NEW",
            status: index === 3 ? "PENDING" : "APPROVED",
            profile: {},
            fee: 0,
            consentText: "test",
            consentVersion: "v1",
          },
        })
      }
      await t.test(
        "only approved members propose; pending and rejected studies are private",
        async () => {
          await assert.rejects(service.save(actors[3], input), /승인된 부원/)
          study = await service.save(actors[0], input)
          studyIds.push(study.id)
          assert.equal(study.participantCount, 1)
          await assert.rejects(service.detail(study.id), /찾을 수/)
          await assert.rejects(
            service.apply(actors[1], study.id, { motivation: "참여" })
          )
          await assert.rejects(
            service.management(actors[1], study.id),
            /스터디장/
          )
          await assert.rejects(
            async () =>
              service.review(actors[0], study.id, {
                action: "APPROVE",
                version: 0,
              }),
            /관리자/
          )
          study = await review(study, "REJECT", "계획 보완")
          assert.equal(study.reason, "계획 보완")
          study = await service.save(
            actors[0],
            { ...input, version: study.version },
            study.id
          )
          assert.equal(study.status, "PENDING")
          study = await review(study, "APPROVE")
          const publicStudy = await service.detail(study.id)
          for (const key of [
            "reason",
            "representativeId",
            "applications",
            "representative",
          ])
            assert.equal(key in publicStudy, false)
          await assert.rejects(
            service.apply(actors[3], study.id, { motivation: "참여" }),
            /승인된 부원/
          )
          await assert.rejects(
            service.apply(actors[0], study.id, { motivation: "참여" }),
            /스터디장/
          )
        }
      )
      await t.test(
        "unique applications, cancellation, owner selection and concurrent capacity",
        async () => {
          applications = []
          for (const actor of actors.slice(1, 3))
            applications.push(
              await service.apply(actor, study.id, { motivation: "함께 공부" })
            )
          await assert.rejects(
            service.apply(actors[1], study.id, { motivation: "중복" }),
            /이미 신청/
          )
          await assert.rejects(
            action(actors[2], applications[0], "APPROVE"),
            /스터디장/
          )
          await assert.rejects(action(actors[2], applications[0], "CANCEL"))
          const cancelled = await action(actors[1], applications[0], "CANCEL")
          assert.equal(cancelled.status, "CANCELLED")
          applications[0] = await service.apply(actors[1], study.id, {
            motivation: "재신청",
          })
          const results = await Promise.allSettled(
            applications.map((a) => action(actors[0], a, "APPROVE"))
          )
          assert.equal(
            results.filter((r) => r.status === "fulfilled").length,
            1
          )
          assert.equal((await service.detail(study.id)).participantCount, 2)
          const accepted = results.find((r) => r.status === "fulfilled").value
          const actor = actors[userIds.indexOf(accepted.userId)]
          await assert.rejects(action(actor, accepted, "CANCEL"), /대기/)
          await assert.rejects(action(actors[0], accepted, "APPROVE"))
          assert.equal(
            (await action(actors[0], accepted, "WITHDRAW")).status,
            "WITHDRAWN"
          )
        }
      )
      await t.test(
        "reapproval pauses intake and preserves applications; post-deadline selection",
        async () => {
          study = await service.save(
            actors[0],
            { ...input, version: study.version },
            study.id
          )
          assert.equal(study.status, "PENDING")
          assert.equal(
            (await service.management(actors[0], study.id)).applications.length,
            2
          )
          await assert.rejects(
            service.apply(actors[2], study.id, { motivation: "신청" })
          )
          study = await review(study, "APPROVE")
          const pending = (
            await service.management(actors[0], study.id)
          ).applications.find((a) => a.status === "PENDING")
          study = await service.save(
            admin,
            {
              ...input,
              startsAt: new Date(now - 120000).toISOString(),
              endsAt: new Date(now - 60000).toISOString(),
              version: study.version,
            },
            study.id,
            true
          )
          const selected = await action(actors[0], pending, "APPROVE")
          assert.equal(selected.status, "APPROVED")
          await assert.rejects(
            service.save(
              actors[0],
              { ...input, capacity: 1, version: study.version },
              study.id
            ),
            /정원/
          )
          await assert.rejects(
            service.save(
              actors[0],
              { ...input, version: study.version - 1 },
              study.id
            ),
            /새로고침/
          )
        }
      )
      await t.test(
        "regular studies are admin-managed and do not accept applications",
        async () => {
          const regular = await service.save(
            admin,
            { ...input, semesterId: semester.id, type: "REGULAR" },
            undefined,
            true
          )
          studyIds.push(regular.id)
          assert.equal(regular.status, "APPROVED")
          await assert.rejects(
            service.apply(actors[1], regular.id, { motivation: "신청" })
          )
          await assert.rejects(
            async () => service.list({}, actors[1]),
            /관리자/
          )
          assert.equal(
            (await service.list({ type: "REGULAR" })).items.length,
            1
          )
        }
      )
      await t.test(
        "semester switch preserves records and blocks member mutations",
        async () => {
          const next = await semesters.save(admin, {
            ...settings,
            name: `study-next-${randomUUID()}`,
          })
          semesterIds.push(next.id)
          await semesters.activate(admin, next.id)
          assert.equal((await service.list({})).total, 0)
          assert.equal((await service.mine(actors[0])).studies.length, 1)
          assert.equal(
            (await service.management(actors[0], study.id)).study.semester
              .isCurrent,
            false
          )
          await assert.rejects(
            service.save(
              actors[0],
              { ...input, version: study.version },
              study.id
            ),
            /이전 학기/
          )
          await assert.rejects(
            service.apply(actors[1], study.id, { motivation: "신청" })
          )
          const pending = (
            await service.management(actors[0], study.id)
          ).applications.find((a) => a.status === "APPROVED")
          await assert.rejects(
            action(actors[0], pending, "WITHDRAW"),
            /이전 학기/
          )
          assert.ok(
            (await db.auditLog.count({ where: { entityId: study.id } })) > 0
          )
        }
      )
    } finally {
      await db.studyApplication.deleteMany({
        where: { studyId: { in: studyIds } },
      })
      await db.auditLog.deleteMany({
        where: { entityId: { in: [...studyIds, ...semesterIds] } },
      })
      await db.study.deleteMany({ where: { id: { in: studyIds } } })
      await db.membership.deleteMany({ where: { userId: { in: userIds } } })
      await db.user.deleteMany({ where: { id: { in: userIds } } })
      await db.semester.deleteMany({ where: { id: { in: semesterIds } } })
      await db.$disconnect()
    }
  }
)

const assert = require("node:assert/strict")
const { randomUUID } = require("node:crypto")
const { test } = require("node:test")
require("./typescript.cjs")
const { Database } = require("../src/database.ts")
const { UsersService } = require("../src/users.ts")
const { SemestersService } = require("../src/semesters.ts")
const { MembershipsService } = require("../src/memberships.ts")

const url = process.env.TEST_DATABASE_URL
// The test never uses DATABASE_URL as a fallback, preventing accidental production writes.
test(
  "PostgreSQL membership lifecycle and authorization",
  { skip: !url },
  async (t) => {
    process.env.DATABASE_URL = url
    const db = new Database({ datasources: { db: { url } } })
    const users = new UsersService(db)
    const semesters = new SemestersService(db)
    const memberships = new MembershipsService(db)
    const admin = { id: randomUUID(), email: "admin@g.skku.edu", isAdmin: true }
    const student = {
      id: randomUUID(),
      email: "student@g.skku.edu",
      isAdmin: false,
    }
    const other = { id: randomUUID(), email: "other@skku.edu", isAdmin: false }
    const profile = {
      name: "테스트 부원",
      studentId: String(Date.now()),
      department: "컴퓨터공학과",
      phone: "010-1234-5678",
      birthDate: "2000-01-01",
      academicStatus: "ENROLLED",
      academicOther: null,
      campus: "NATURAL",
    }
    const input = { profile, consent: true, consentVersion: "v1" }
    const now = Date.now()
    const settings = {
      name: `test-${randomUUID()}`,
      newStartsAt: new Date(now - 60000).toISOString(),
      newEndsAt: new Date(now + 3600000).toISOString(),
      returningStartsAt: new Date(now - 60000).toISOString(),
      returningEndsAt: new Date(now + 3600000).toISOString(),
      newFee: 20000,
      returningFee: 10000,
      bank: "테스트 은행",
      accountNumber: "123",
      accountHolder: "테스트",
      consentText: "테스트 동의문",
      consentVersion: "v1",
      isOpen: true,
    }
    const semesterIds = []
    const userIds = []
    const membershipIds = []
    async function action(m, type, fields = {}) {
      return memberships.action(admin, m.id, {
        action: type,
        version: m.version,
        ...fields,
      })
    }
    try {
      const semester = await semesters.save(admin, settings)
      semesterIds.push(semester.id)
      await semesters.activate(admin, semester.id)
      let m
      await t.test(
        "new signup, duplicate, unpaid approval, privacy",
        async () => {
          m = await memberships.submit(student, input)
          membershipIds.push(m.id)
          userIds.push(m.userId)
          assert.equal(m.type, "NEW")
          assert.equal(m.linkConfirmed, true)
          assert.equal(m.fee, 20000)
          await assert.rejects(memberships.submit(student, input))
          await assert.rejects(action(m, "APPROVE"), /입금/)
          await assert.rejects(users.list(student, {}), /관리자/)
          await assert.rejects(memberships.detail(other, m.id), /관리자/)
          await assert.rejects(memberships.submit(other, input, m.id))
          assert.deepEqual(await memberships.mine(other), [])
        }
      )
      await t.test(
        "changes and resubmission remain possible after deadline",
        async () => {
          m = await action(m, "REQUEST_CHANGES", { reason: "전화번호 확인" })
          await semesters.save(
            admin,
            {
              ...settings,
              newStartsAt: new Date(now - 3600000).toISOString(),
              newEndsAt: new Date(now - 1000).toISOString(),
            },
            semester.id
          )
          await assert.rejects(
            memberships.submit(other, {
              ...input,
              profile: { ...profile, studentId: `${profile.studentId}9` },
            }),
            /기간/
          )
          m = await memberships.submit(
            student,
            { ...input, profile: { ...profile, phone: "010-9999-9999" } },
            m.id
          )
          assert.equal(m.status, "PENDING")
          assert.equal(m.reason, null)
          assert.equal(m.fee, 20000)
        }
      )
      await t.test(
        "payment then approval, immutable completed submission",
        async () => {
          m = await action(m, "PAYMENT", { confirmed: true })
          m = await action(m, "APPROVE")
          assert.equal(m.status, "APPROVED")
          await assert.rejects(memberships.submit(student, input, m.id))
          await assert.rejects(action(m, "PAYMENT", { confirmed: false }))
          const history = await memberships.detail(admin, m.id)
          assert.ok(history.audit.some((a) => a.action === "APPROVE"))
        }
      )
      await t.test(
        "previous approved semester determines returning signup",
        async () => {
          const next = await semesters.save(admin, {
            ...settings,
            name: `next-${randomUUID()}`,
            newStartsAt: new Date(now - 30000).toISOString(),
          })
          semesterIds.push(next.id)
          await semesters.activate(admin, next.id)
          const returning = await memberships.submit(student, input)
          membershipIds.push(returning.id)
          assert.equal(returning.type, "RETURNING")
          assert.equal(returning.fee, 10000)
        }
      )
      await t.test(
        "manual historical roster, private pending match, confirmed link",
        async () => {
          const old = await semesters.save(admin, {
            ...settings,
            name: `old-${randomUUID()}`,
            newStartsAt: new Date(now - 86400000).toISOString(),
            newEndsAt: new Date(now - 3600000).toISOString(),
            isOpen: false,
          })
          semesterIds.push(old.id)
          const legacy = await users.save(admin, {
            ...profile,
            studentId: `${profile.studentId}1`,
            name: "기존 명부 이름",
          })
          userIds.push(legacy.id)
          const historical = await memberships.historical(admin, {
            userId: legacy.id,
            semesterId: old.id,
          })
          membershipIds.push(historical.id)
          let candidate = await memberships.submit(other, {
            ...input,
            profile: {
              ...profile,
              studentId: legacy.studentId,
              name: "신청자 이름",
            },
          })
          membershipIds.push(candidate.id)
          assert.equal(candidate.type, "RETURNING")
          assert.equal(candidate.linkConfirmed, false)
          assert.equal((await users.me(other)).user, null)
          const mine = await memberships.mine(other)
          assert.equal(mine.length, 1)
          assert.equal(mine[0].profile.name, "신청자 이름")
          assert.equal(mine[0].user, undefined)
          candidate = await action(candidate, "PAYMENT", { confirmed: true })
          await assert.rejects(action(candidate, "APPROVE"), /계정 연결/)
          candidate = await action(candidate, "CONFIRM_LINK")
          assert.equal((await users.me(other)).user.id, legacy.id)
          candidate = await action(candidate, "APPROVE")
          assert.equal(candidate.status, "APPROVED")
          await assert.rejects(
            memberships.submit(
              { ...other, id: randomUUID() },
              { ...input, profile: { ...profile, studentId: legacy.studentId } }
            ),
            /연결된 학번/
          )
        }
      )
      await t.test(
        "concurrent action accepts one version and records one result",
        async () => {
          const pending = (await memberships.mine(student)).find(
            (row) => row.status === "PENDING"
          )
          const result = await Promise.allSettled([
            action(pending, "PAYMENT", { confirmed: true }),
            action(pending, "REQUEST_CHANGES", { reason: "동시 처리" }),
          ])
          assert.equal(result.filter((r) => r.status === "fulfilled").length, 1)
          const latest = await memberships.detail(admin, pending.id)
          assert.equal(latest.version, pending.version + 1)
          await assert.rejects(action(pending, "APPROVE"))
        }
      )
      await t.test(
        "filters, consent freshness, closed recruitment",
        async () => {
          const page = await memberships.list(admin, {
            status: "APPROVED",
            search: profile.studentId,
          })
          assert.ok(page.total >= 2)
          await assert.rejects(memberships.list(admin, { page: "-1" }))
          await assert.rejects(
            memberships.submit(
              { ...student, id: randomUUID() },
              { ...input, consentVersion: "obsolete" }
            ),
            /동의문/
          )
          const current = await semesters.current()
          await assert.rejects(
            semesters.save(
              admin,
              { ...settings, name: current.name, consentText: "변경된 동의문" },
              current.id
            ),
            /버전/
          )

          await semesters.save(
            admin,
            {
              ...settings,
              name: current.name,
              newStartsAt: current.newStartsAt.toISOString(),
              isOpen: false,
            },
            current.id
          )
          await assert.rejects(
            memberships.submit({ ...student, id: randomUUID() }, input),
            /모집/
          )
        }
      )
    } finally {
      await db.auditLog.deleteMany({
        where: {
          OR: [
            { actorId: { in: [admin.id, student.id, other.id] } },
            { entityId: { in: membershipIds } },
          ],
        },
      })
      await db.membership.deleteMany({
        where: { semesterId: { in: semesterIds } },
      })
      await db.user.deleteMany({ where: { id: { in: userIds } } })
      await db.semester.deleteMany({ where: { id: { in: semesterIds } } })
      await db.$disconnect()
    }
  }
)

const assert = require("node:assert/strict")
const { test } = require("node:test")
const { randomUUID } = require("node:crypto")
require("./typescript.cjs")
const { StudiesService } = require("../src/studies.ts")

test("unlimited capacity is allowed only for regular studies", async () => {
  const semester = { id: randomUUID(), isCurrent: true }
  const admin = { id: randomUUID(), isAdmin: true }
  let writes = 0
  const tx = {
    semester: { findFirst: async () => semester },
    study: {
      create: async ({ data }) => {
        writes++
        return {
          ...data,
          id: randomUUID(),
          semester,
          _count: { applications: 0 },
        }
      },
    },
    auditLog: { create: async () => ({}) },
  }
  const service = new StudiesService({ transaction: async (fn) => fn(tx) })
  const input = {
    semesterId: semester.id,
    type: "REGULAR",
    capacity: 0,
    title: "C 기초",
    description: "운영진 팀 구성",
    audience: "추후 안내",
    format: "팀 구성",
    schedule: "추후 안내",
    location: "추후 안내",
    resourceUrl: null,
    startsAt: "2026-09-01T00:00:00+09:00",
    endsAt: "2026-09-04T23:59:59+09:00",
  }
  assert.equal((await service.save(admin, input, undefined, true)).capacity, 0)
  await assert.rejects(
    service.save(admin, { ...input, type: "AUTONOMOUS" }, undefined, true),
    /1명 이상/
  )
  assert.throws(() =>
    service.save(admin, { ...input, capacity: -1 }, undefined, true)
  )
  assert.equal(writes, 1)
})

test("legacy studies reject new applications even with future dates", async () => {
  const service = new StudiesService({
    transaction: async (fn) =>
      fn({
        study: {
          findUniqueOrThrow: async () => ({
            isLegacy: true,
            semester: { isCurrent: true },
            type: "AUTONOMOUS",
            status: "APPROVED",
            startsAt: new Date(Date.now() - 10000),
            endsAt: new Date(Date.now() + 10000),
          }),
        },
      }),
  })
  await assert.rejects(
    service.apply({ id: randomUUID() }, randomUUID(), { motivation: "참여" }),
    /현재 신청 가능한/
  )
})

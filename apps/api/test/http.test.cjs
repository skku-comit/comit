const assert = require("node:assert/strict")
const { createServer } = require("node:http")
const { once } = require("node:events")
const { randomUUID } = require("node:crypto")
const { test } = require("node:test")
require("./typescript.cjs")
const { Database } = require("../src/database.ts")
const { NestFactory } = require("@nestjs/core")
const { AppModule } = require("../src/app.module.ts")
const { ApiErrors } = require("../src/errors.ts")

test(
  "HTTP API enforces authentication, admin authorization, and input validation",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
    const authServer = createServer((request, response) => {
      const isAdmin = request.headers.authorization === "Bearer admin-token"
      response.setHeader("Content-Type", "application/json")
      response.end(
        JSON.stringify({
          id: isAdmin
            ? "5aeb6a8c-f145-466b-a344-4bc2fc819001"
            : "5aeb6a8c-f145-466b-a344-4bc2fc819002",
          email: isAdmin ? "admin@g.skku.edu" : "student@skku.edu",
          email_confirmed_at: "2026-01-01T00:00:00Z",
          identities: [{ provider: "google" }],
        })
      )
    })
    authServer.listen(0, "127.0.0.1")
    await once(authServer, "listening")
    process.env.SUPABASE_URL = `http://127.0.0.1:${authServer.address().port}`
    process.env.SUPABASE_PUBLISHABLE_KEY = "test-key"
    process.env.ADMIN_EMAILS = "admin@g.skku.edu"
    const app = await NestFactory.create(AppModule, { logger: false })
    app.useGlobalFilters(new ApiErrors())
    await app.listen(0, "127.0.0.1")
    const origin = await app.getUrl()
    const request = (path, token) =>
      fetch(`${origin}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    const db = new Database({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    })
    const semester = await db.semester.create({
      data: {
        name: `http-${randomUUID()}`,
        newStartsAt: new Date(),
        newEndsAt: new Date(),
        returningStartsAt: new Date(),
        returningEndsAt: new Date(),
        newFee: 0,
        returningFee: 0,
        bank: "test",
        accountNumber: "test",
        accountHolder: "test",
        consentText: "test",
        consentVersion: "v1",
      },
    })
    const study = await db.study.create({
      data: {
        semesterId: semester.id,
        type: "REGULAR",
        title: "공개 스터디",
        description: "공개 소개",
        audience: "부원",
        format: "온라인",
        schedule: "매주",
        location: "온라인",
        startsAt: new Date(),
        endsAt: new Date(),
        capacity: 10,
        status: "APPROVED",
        reason: "비공개 사유",
      },
    })
    try {
      const publicResponse = await request(`/studies/${study.id}`)
      assert.equal(publicResponse.status, 200)
      const publicBody = await publicResponse.json()
      for (const field of [
        "reason",
        "representativeId",
        "representative",
        "applications",
      ])
        assert.equal(field in publicBody, false)
      assert.equal((await request(`/studies/${study.id}/manage`)).status, 401)
      assert.equal(
        (await request(`/studies/${study.id}/manage`, "student-token")).status,
        403
      )
      assert.equal(
        (await request(`/studies/${study.id}/manage`, "admin-token")).status,
        200
      )
      assert.equal(
        (await request("/studies/admin", "student-token")).status,
        403
      )
      assert.equal((await request("/studies/not-a-uuid")).status, 400)

      assert.equal((await request("/users/me")).status, 401)
      assert.equal((await request("/users", "student-token")).status, 403)
      const me = await request("/users/me", "student-token")
      assert.equal(me.status, 200)
      assert.equal((await me.json()).email, "student@skku.edu")
      assert.equal(
        (await request("/memberships/me", "student-token")).status,
        200
      )
      assert.equal((await request("/users", "admin-token")).status, 200)
      assert.equal((await request("/semesters", "student-token")).status, 403)
      assert.equal((await request("/semesters", "admin-token")).status, 200)
      assert.equal(
        (
          await request(
            "/memberships/5aeb6a8c-f145-466b-a344-4bc2fc819099",
            "student-token"
          )
        ).status,
        403
      )
      assert.equal(
        (await request("/memberships/not-a-uuid", "admin-token")).status,
        400
      )
      assert.equal(
        (await request("/memberships?status=INVALID", "admin-token")).status,
        400
      )
      assert.equal(
        (await request("/memberships?semesterId=invalid", "admin-token"))
          .status,
        400
      )
      assert.equal((await request("/users?page=-1", "admin-token")).status, 400)
    } finally {
      await db.study.delete({ where: { id: study.id } })
      await db.semester.delete({ where: { id: semester.id } })
      await db.$disconnect()

      await app.close()
      await new Promise((resolve) => authServer.close(resolve))
    }
  }
)

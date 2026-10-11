const assert = require("node:assert/strict")
const { createServer } = require("node:http")
const { once } = require("node:events")
const { test } = require("node:test")
require("./typescript.cjs")
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
    try {
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
      await app.close()
      await new Promise((resolve) => authServer.close(resolve))
    }
  }
)

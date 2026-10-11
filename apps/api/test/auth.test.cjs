const assert = require("node:assert/strict")
const { createServer } = require("node:http")
const { once } = require("node:events")
const { test } = require("node:test")
require("./typescript.cjs")
const { AuthGuard } = require("../src/auth.ts")
const { profileSchema, semesterSchema, parse } = require("../src/validation.ts")
test("Google authentication verifies account and domain before assigning admin", async () => {
  const server = createServer((request, response) => {
    const token = request.headers.authorization?.slice(7)
    response.setHeader("Content-Type", "application/json")
    if (token === "invalid") {
      response.statusCode = 401
      response.end(JSON.stringify({ message: "Invalid JWT" }))
      return
    }
    response.end(
      JSON.stringify({
        id: "5aeb6a8c-f145-466b-a344-4bc2fc819000",
        email: token === "foreign" ? "someone@gmail.com" : "admin@g.skku.edu",
        email_confirmed_at: "2026-01-01T00:00:00Z",
        identities: [{ provider: token === "password" ? "email" : "google" }],
      })
    )
  })
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const previous = { ...process.env }
  process.env.SUPABASE_URL = `http://127.0.0.1:${server.address().port}`
  process.env.SUPABASE_PUBLISHABLE_KEY = "test-key"
  process.env.ADMIN_EMAILS = "admin@g.skku.edu"
  const guard = new AuthGuard()
  const request = (token) => ({
    headers: { authorization: token ? `Bearer ${token}` : undefined },
  })
  const context = (req) => ({ switchToHttp: () => ({ getRequest: () => req }) })
  try {
    for (const token of [null, "invalid", "foreign", "password"])
      await assert.rejects(guard.canActivate(context(request(token))))
    const req = request("google")
    assert.equal(await guard.canActivate(context(req)), true)
    assert.equal(req.identity.isAdmin, true)
  } finally {
    for (const key of [
      "SUPABASE_URL",
      "SUPABASE_PUBLISHABLE_KEY",
      "ADMIN_EMAILS",
    ]) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
    await new Promise((resolve) => server.close(resolve))
  }
})
test("invalid dates and OTHER academic state require valid information", () => {
  const profile = {
    name: "이름",
    studentId: "2026000000",
    department: "학과",
    phone: "01012345678",
    birthDate: "2000-01-01",
    academicStatus: "OTHER",
    campus: "NATURAL",
  }
  assert.throws(() => parse(profileSchema, profile))
  assert.throws(() =>
    parse(profileSchema, {
      ...profile,
      academicOther: "기타",
      birthDate: "2000-02-30",
    })
  )
  assert.equal(
    parse(profileSchema, { ...profile, academicOther: "기타" }).academicOther,
    "기타"
  )
  assert.throws(() => parse(semesterSchema, { isOpen: true, consentText: "" }))
})

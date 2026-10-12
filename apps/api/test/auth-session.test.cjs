const assert = require("node:assert/strict")
const { Buffer } = require("node:buffer")
const { URL } = require("node:url")
const { once } = require("node:events")
const { createServer } = require("node:http")
const {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} = require("node:crypto")
const { test } = require("node:test")
require("./typescript.cjs")
const { Controller, Get, Module, Req, UseGuards } = require("@nestjs/common")
const { NestFactory } = require("@nestjs/core")
const { AuthController } = require("../src/auth-session.ts")
const { AuthGuard } = require("../src/auth.ts")
const { ApiErrors } = require("../src/errors.ts")

class ProbeController {
  me(request) {
    return request.identity
  }
}
Controller("probe")(ProbeController)
Get()(
  ProbeController.prototype,
  "me",
  Object.getOwnPropertyDescriptor(ProbeController.prototype, "me")
)
Req()(ProbeController.prototype, "me", 0)
UseGuards(AuthGuard)(ProbeController)
class TestModule {}
Module({ controllers: [AuthController, ProbeController] })(TestModule)

// 테스트 전용 키로 암호화가 유효한 만료 상태도 검증한다.
function decode(value) {
  const bytes = Buffer.from(value, "base64url")
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.AUTH_SESSION_SECRET, "hex"),
    bytes.subarray(0, 12)
  )
  decipher.setAuthTag(bytes.subarray(12, 28))
  return JSON.parse(
    Buffer.concat([
      decipher.update(bytes.subarray(28)),
      decipher.final(),
    ]).toString()
  )
}
function encode(value) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.AUTH_SESSION_SECRET, "hex"),
    iv
  )
  const bytes = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ])
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64url")
}

test("API owns PKCE login, sealed sessions, refresh and logout across HTTP requests", async () => {
  const previous = { ...process.env }
  const calls = []
  let challenge
  let foreign = false
  let revoked = false
  const user = () => ({
    id: "5aeb6a8c-f145-466b-a344-4bc2fc819000",
    email: foreign ? "someone@gmail.com" : "admin@g.skku.edu",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    identities: [{ provider: "google" }],
  })
  const auth = createServer(async (request, response) => {
    let body = ""
    for await (const chunk of request) body += chunk
    calls.push({ url: request.url, body: body ? JSON.parse(body) : null })
    response.setHeader("Content-Type", "application/json")
    if (request.url.startsWith("/auth/v1/token")) {
      const input = JSON.parse(body)
      if (request.url.includes("pkce")) {
        assert.equal(
          createHash("sha256").update(input.code_verifier).digest("base64url"),
          challenge
        )
        if (input.auth_code === "bad-code") {
          response.statusCode = 400
          response.end(JSON.stringify({ message: "Invalid code" }))
          return
        }
      } else {
        assert.equal(input.refresh_token, "refresh-secret")
        if (revoked) {
          response.statusCode = 400
          response.end(JSON.stringify({ message: "Invalid refresh token" }))
          return
        }
      }
      response.end(
        JSON.stringify({
          access_token: "access-secret",
          refresh_token: "refresh-secret",
          token_type: "bearer",
          expires_in: 3600,
          user: user(),
        })
      )
    } else if (request.url.startsWith("/auth/v1/logout")) {
      revoked = true
      response.statusCode = 204
      response.end()
    } else if (request.url === "/auth/v1/user") {
      assert.equal(request.headers.authorization, "Bearer access-secret")
      response.end(JSON.stringify(user()))
    } else {
      response.statusCode = 404
      response.end("{}")
    }
  })
  auth.listen(0, "127.0.0.1")
  await once(auth, "listening")
  process.env.SUPABASE_URL = `http://127.0.0.1:${auth.address().port}`
  process.env.SUPABASE_PUBLISHABLE_KEY = "test-key"
  process.env.AUTH_SESSION_SECRET = "ab".repeat(32)
  process.env.AUTH_ALLOWED_ORIGINS =
    "http://localhost:3000,http://localhost:3001"
  process.env.ADMIN_EMAILS = "admin@g.skku.edu"
  const app = await NestFactory.create(TestModule, { logger: false })
  app.useGlobalFilters(new ApiErrors())
  await app.listen(0, "127.0.0.1")
  const url = await app.getUrl()
  const origin = "http://localhost:3000"
  const post = (path, body, session) =>
    fetch(`${url}/auth/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-comit-origin": origin,
        ...(session ? { "x-comit-session": session } : {}),
      },
      body: JSON.stringify(body),
    })
  const me = (session, site = origin) =>
    fetch(`${url}/probe`, {
      headers: { "x-comit-session": session, "x-comit-origin": site },
    })
  try {
    assert.equal(
      (await post("login", { origin: "https://attacker.example" })).status,
      400
    )
    const start = await post("login", { origin })
    assert.equal(start.status, 200)
    assert.equal(start.headers.get("cache-control"), "no-store")
    const login = await start.json()
    const authorize = new URL(login.url)
    challenge = authorize.searchParams.get("code_challenge")
    assert.ok(challenge)
    assert.equal(authorize.searchParams.get("code_challenge_method"), "s256")
    const callback = new URL(authorize.searchParams.get("redirect_to"))
    assert.equal(callback.origin, origin)
    const flowId = decode(login.state).flowId
    assert.ok(flowId)
    assert.ok(!login.state.includes("code-verifier"))
    const input = { origin, state: login.state, code: "good-code" }
    assert.equal(
      (await post("callback", { ...input, state: "tampered" })).status,
      401
    )
    assert.equal(
      (await post("callback", { ...input, origin: "http://localhost:3001" }))
        .status,
      401
    )
    assert.equal(
      (
        await post("callback", {
          ...input,
          state: encode({ ...decode(login.state), flowId: "wrong" }),
        })
      ).status,
      401
    )
    assert.equal(
      (await post("callback", { ...input, code: "bad-code" })).status,
      401
    )
    assert.equal(
      (
        await post("callback", {
          ...input,
          state: encode({ ...decode(login.state), expires: 0 }),
        })
      ).status,
      401
    )
    const exchange = await post("callback", input)
    assert.equal(exchange.status, 200)
    const { session } = await exchange.json()
    assert.ok(!session.includes("access-secret"))
    const loggedIn = await me(session)
    assert.equal(loggedIn.status, 200)
    assert.equal((await loggedIn.json()).isAdmin, true)
    assert.equal((await me(session, "http://localhost:3001")).status, 401)
    assert.equal((await me("tampered")).status, 401)
    assert.equal(
      (await me(encode({ ...decode(session), expires: 0 }))).status,
      401
    )
    const expiredAccess = encode({ ...decode(session), tokenExpires: 0 })
    const refreshed = await me(expiredAccess)
    assert.equal(refreshed.status, 200)
    assert.ok(refreshed.headers.get("x-comit-session"))
    assert.equal(
      (await me(refreshed.headers.get("x-comit-session"))).status,
      200
    )
    assert.equal(
      calls.filter((call) => call.url.includes("refresh_token")).length,
      1
    )
    foreign = true
    assert.equal((await me(session)).status, 403)
    assert.equal((await post("callback", input)).status, 401)
    foreign = false
    assert.equal((await post("logout", {}, session)).status, 200)
    assert.ok(calls.some((call) => call.url === "/auth/v1/logout?scope=local"))
    assert.equal((await me(expiredAccess)).status, 401)
    assert.equal((await post("logout", {})).status, 200)
    delete process.env.AUTH_SESSION_SECRET
    assert.equal((await post("login", { origin })).status, 503)
  } finally {
    await app.close()
    await new Promise((resolve) => auth.close(resolve))
    for (const key of [
      "SUPABASE_URL",
      "SUPABASE_PUBLISHABLE_KEY",
      "AUTH_SESSION_SECRET",
      "AUTH_ALLOWED_ORIGINS",
      "ADMIN_EMAILS",
    ]) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
})

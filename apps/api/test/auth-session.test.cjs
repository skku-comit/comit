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
const {
  Controller,
  Get,
  Post,
  Module,
  Req,
  UseGuards,
} = require("@nestjs/common")
const { NestFactory } = require("@nestjs/core")
const { AuthController } = require("../src/auth-session.ts")
const { AuthGuard } = require("../src/auth.ts")
const { ApiErrors } = require("../src/errors.ts")
const { setupBrowser } = require("../src/browser.ts")

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
ProbeController.prototype.change = function (request) {
  return this.me(request)
}
Post("change")(
  ProbeController.prototype,
  "change",
  Object.getOwnPropertyDescriptor(ProbeController.prototype, "change")
)
Req()(ProbeController.prototype, "change", 0)
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
  process.env.API_PUBLIC_URL = "https://api.example"
  process.env.ADMIN_EMAILS = "admin@g.skku.edu"
  const app = await NestFactory.create(TestModule, { logger: false })
  app.useGlobalFilters(new ApiErrors())
  setupBrowser(app)
  await app.listen(0, "127.0.0.1")
  const url = await app.getUrl()
  const origin = "http://localhost:3000"
  const cookieFrom = (response, prefix) =>
    response.headers
      .getSetCookie()
      .find((value) => value.startsWith(prefix))
      ?.split(";")[0]
  const valueOf = (cookie) =>
    decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1))
  const replaceCookie = (cookie, value) => `${cookie.split("=")[0]}=${value}`
  const start = (site = origin, destination = "/my") =>
    fetch(
      `${url}/auth/login?origin=${encodeURIComponent(site)}&destination=${encodeURIComponent(destination)}`,
      { redirect: "manual" }
    )
  const finish = (callback, cookie, code = "good-code") => {
    const target = new URL(callback)
    target.searchParams.set("code", code)
    return fetch(`${url}${target.pathname}${target.search}`, {
      headers: cookie ? { Cookie: cookie } : {},
      redirect: "manual",
    })
  }
  const me = (cookie, site = origin, method = "GET") =>
    fetch(`${url}/probe${method === "POST" ? "/change" : ""}`, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(site ? { Origin: site } : {}),
      },
    })
  try {
    assert.equal((await start("https://attacker.example")).status, 400)
    const preflight = await fetch(`${url}/probe/change`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.headers.get("access-control-allow-origin"), origin)
    assert.equal(
      preflight.headers.get("access-control-allow-credentials"),
      "true"
    )
    assert.ok(preflight.headers.get("vary").includes("Origin"))
    const login = await start()
    assert.equal(login.status, 302)
    assert.equal(login.headers.get("cache-control"), "no-store")
    const authorize = new URL(login.headers.get("location"))
    challenge = authorize.searchParams.get("code_challenge")
    assert.ok(challenge)
    const callback = new URL(authorize.searchParams.get("redirect_to"))
    assert.equal(callback.origin, "https://api.example")
    assert.equal(callback.pathname, "/auth/callback")
    assert.ok(callback.searchParams.get("login"))
    const stateCookie = cookieFrom(login, "__Host-comit-login-")
    assert.ok(stateCookie)
    const flags = login.headers.getSetCookie()[0]
    for (const flag of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"])
      assert.ok(flags.includes(flag))
    assert.ok(!flags.includes("Domain="))
    assert.equal((await finish(callback, undefined)).status, 401)
    assert.equal(
      (await finish(callback, replaceCookie(stateCookie, "tampered"))).status,
      401
    )
    const expiredState = replaceCookie(
      stateCookie,
      encode({ ...decode(valueOf(stateCookie)), expires: 0 })
    )
    assert.equal(
      (await finish(callback, expiredState)).headers.get("location"),
      `${origin}/login?error=1`
    )
    assert.equal(
      (await finish(callback, stateCookie, "bad-code")).headers.get("location"),
      `${origin}/login?error=1`
    )
    const exchange = await finish(callback, stateCookie)
    assert.equal(exchange.status, 302)
    assert.equal(exchange.headers.get("location"), `${origin}/my`)
    assert.ok(
      exchange.headers
        .getSetCookie()
        .some(
          (value) =>
            value.startsWith(stateCookie.split("=")[0]) &&
            value.includes("Expires=Thu, 01 Jan 1970")
        )
    )
    assert.equal(
      await exchange.text(),
      "Found. Redirecting to http://localhost:3000/my"
    )
    const session = cookieFrom(exchange, "__Host-comit-session-")
    assert.ok(session)
    const loggedIn = await me(session)
    assert.equal(loggedIn.status, 200)
    assert.equal((await loggedIn.json()).isAdmin, true)
    assert.equal(loggedIn.headers.get("access-control-allow-origin"), origin)
    assert.equal((await me(session, "http://localhost:3001")).status, 401)
    assert.equal((await me(session, "https://attacker.example")).status, 403)
    assert.equal((await me(session, "", "POST")).status, 403)
    assert.equal((await me(session, origin, "POST")).status, 201)
    assert.equal((await me(replaceCookie(session, "tampered"))).status, 401)
    const expired = await me(
      replaceCookie(
        session,
        encode({ ...decode(valueOf(session)), expires: 0 })
      )
    )
    assert.equal(expired.status, 401)
    assert.ok(expired.headers.getSetCookie().length)
    const expiredAccess = replaceCookie(
      session,
      encode({ ...decode(valueOf(session)), tokenExpires: 0 })
    )
    const refreshed = await me(expiredAccess)
    assert.equal(refreshed.status, 200)
    const renewed = cookieFrom(refreshed, "__Host-comit-session-")
    assert.ok(renewed)
    assert.equal(refreshed.headers.get("x-comit-session"), null)
    assert.equal((await me(renewed)).status, 200)
    assert.equal(
      calls.filter((call) => call.url.includes("refresh_token")).length,
      1
    )
    foreign = true
    assert.equal((await me(session)).status, 403)
    assert.equal(
      (await finish(callback, stateCookie)).headers.get("location"),
      `${origin}/login?error=1`
    )
    foreign = false
    const adminLogin = await start("http://localhost:3001", "/")
    const adminAuthorize = new URL(adminLogin.headers.get("location"))
    challenge = adminAuthorize.searchParams.get("code_challenge")
    const adminCallback = adminAuthorize.searchParams.get("redirect_to")
    const adminExchange = await finish(
      adminCallback,
      cookieFrom(adminLogin, "__Host-comit-login-")
    )
    assert.equal(
      adminExchange.headers.get("location"),
      "http://localhost:3001/"
    )
    const adminSession = cookieFrom(adminExchange, "__Host-comit-session-")
    assert.notEqual(adminSession.split("=")[0], session.split("=")[0])
    assert.equal(
      (await me(`${session}; ${adminSession}`, "http://localhost:3001")).status,
      200
    )
    assert.equal((await me(`${session}; ${adminSession}`, origin)).status, 200)
    assert.equal(
      (
        await fetch(`${url}/probe`, {
          headers: {
            "x-comit-session": valueOf(session),
            "x-comit-origin": origin,
          },
        })
      ).status,
      401
    )
    const logout = await fetch(`${url}/auth/logout`, {
      method: "POST",
      headers: { Cookie: session, Origin: origin },
      redirect: "manual",
    })
    assert.equal(logout.status, 303)
    assert.equal(logout.headers.get("location"), `${origin}/login`)
    assert.ok(
      logout.headers
        .getSetCookie()
        .some(
          (value) =>
            value.startsWith(session.split("=")[0]) &&
            value.includes("Expires=Thu, 01 Jan 1970")
        )
    )
    assert.ok(calls.some((call) => call.url === "/auth/v1/logout?scope=local"))
    assert.equal((await me(expiredAccess)).status, 401)
    assert.equal(
      (
        await fetch(`${url}/auth/logout`, {
          method: "POST",
          redirect: "manual",
        })
      ).status,
      403
    )
    delete process.env.AUTH_SESSION_SECRET
    assert.equal((await start()).status, 503)
  } finally {
    await app.close()
    await new Promise((resolve) => auth.close(resolve))
    for (const key of [
      "SUPABASE_URL",
      "SUPABASE_PUBLISHABLE_KEY",
      "AUTH_SESSION_SECRET",
      "AUTH_ALLOWED_ORIGINS",
      "ADMIN_EMAILS",
      "API_PUBLIC_URL",
    ]) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
})

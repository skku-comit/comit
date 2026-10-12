const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const { URL } = require("node:url")
const { Headers, Response, AbortSignal } = globalThis
const ts = require("typescript")

function load(filename, mocks, fetch) {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  })
  const module = { exports: {} }
  vm.runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      require: (name) => {
        assert.ok(name in mocks, `Unexpected frontend dependency: ${name}`)
        return mocks[name]
      },
      process,
      URL,
      Headers,
      AbortSignal,
      fetch,
    },
    { filename }
  )
  return module.exports
}

for (const app of ["web", "admin"]) {
  test(`${app} forwards only API sessions, protects cookies and rejects cross-origin mutations`, async () => {
    const previous = { ...process.env }
    process.env.SITE_URL = `https://${app}.example`
    process.env.API_URL = "http://api.example"
    const values = new Map()
    const writes = []
    const requests = []
    const jar = {
      get: (name) =>
        values.has(name) ? { value: values.get(name) } : undefined,
      set: (name, value, options) => {
        writes.push({ name, value, options })
        if (options.maxAge === 0) values.delete(name)
        else values.set(name, value)
      },
      delete: (name) => values.delete(name),
    }
    let status = 200
    const fetch = async (url, init) => {
      requests.push({ url, init })
      if (url.endsWith("auth/login"))
        return Response.json({
          url: "https://accounts.example/login",
          state: "sealed-pkce",
        })
      if (url.endsWith("auth/callback"))
        return Response.json({ session: "sealed-session" })
      return Response.json(
        status === 200
          ? { email: "student@skku.edu" }
          : { message: "로그인이 필요합니다." },
        {
          status,
          headers:
            status === 200 ? { "x-comit-session": "renewed-session" } : {},
        }
      )
    }
    const root = path.join(__dirname, "../../", app)
    const session = load(
      path.join(root, "lib/session.ts"),
      {
        "server-only": {},
        "next/headers": { cookies: async () => jar },
      },
      fetch
    )
    class NextResponse extends Response {
      static redirect(url, status = 307) {
        return new Response(null, {
          status,
          headers: { location: String(url) },
        })
      }
      static json(body, init) {
        return Response.json(body, init)
      }
    }
    const route = (filename) =>
      load(
        path.join(root, "app", filename, "route.ts"),
        {
          "@/lib/session": session,
          "next/server": { NextResponse },
        },
        fetch
      )
    const request = (
      pathname,
      method = "GET",
      origin = process.env.SITE_URL
    ) => ({
      method,
      nextUrl: new URL(`${process.env.SITE_URL}${pathname}`),
      headers: new Headers({
        origin,
        authorization: "Bearer browser-supplied-token",
      }),
      text: async () => "{}",
    })
    try {
      const login = await route("auth/login").GET()
      assert.equal(
        login.headers.get("location"),
        "https://accounts.example/login"
      )
      assert.deepEqual(
        { ...writes[0].options },
        {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/auth",
          maxAge: 600,
        }
      )
      const callback = await route("auth/callback").GET(
        request("/auth/callback?code=oauth-code")
      )
      assert.equal(
        callback.headers.get("location"),
        `${process.env.SITE_URL}${app === "web" ? "/my" : "/"}`
      )
      const exchange = requests.find((item) =>
        item.url.endsWith("auth/callback")
      )
      assert.deepEqual(JSON.parse(exchange.init.body), {
        code: "oauth-code",
        state: "sealed-pkce",
        origin: process.env.SITE_URL,
      })
      assert.equal(values.has("comit-login"), false)
      assert.equal(values.get("comit-session"), "sealed-session")
      const failedCallback = await route("auth/callback").GET(
        request("/auth/callback?code=invalid")
      )
      assert.equal(
        failedCallback.headers.get("location"),
        `${process.env.SITE_URL}/login?error=1`
      )
      assert.equal(values.get("comit-session"), "sealed-session")
      const cookie = writes.find((item) => item.name === "comit-session")
      assert.equal(cookie.options.httpOnly, true)
      assert.equal(cookie.options.secure, true)
      const proxy = route("api/backend/[...path]")
      const response = await proxy.GET(request("/api/backend/users/me"), {
        params: Promise.resolve({ path: ["users", "me"] }),
      })
      assert.equal(response.status, 200)
      assert.equal(response.headers.has("x-comit-session"), false)
      const forwarded = requests.at(-1)
      assert.equal(forwarded.url, "http://api.example/users/me")
      assert.equal(
        forwarded.init.headers.get("x-comit-session"),
        "sealed-session"
      )
      assert.equal(
        forwarded.init.headers.get("x-comit-origin"),
        process.env.SITE_URL
      )
      assert.equal(forwarded.init.headers.has("authorization"), false)
      assert.equal(values.get("comit-session"), "renewed-session")
      const before = requests.length
      assert.equal(
        (
          await proxy.POST(
            request("/api/backend/users", "POST", "https://attacker.example"),
            { params: Promise.resolve({ path: ["users"] }) }
          )
        ).status,
        403
      )
      assert.equal(
        (
          await route("auth/logout").POST(
            request("/auth/logout", "POST", "https://attacker.example")
          )
        ).status,
        403
      )
      assert.equal(requests.length, before)
      status = 401
      assert.equal(
        (
          await proxy.GET(request("/api/backend/users/me"), {
            params: Promise.resolve({ path: ["users", "me"] }),
          })
        ).status,
        401
      )
      assert.equal(values.has("comit-session"), false)
      status = 200
      const logout = await route("auth/logout").POST(
        request("/auth/logout", "POST")
      )
      assert.equal(logout.status, 303)
      assert.equal(
        logout.headers.get("location"),
        `${process.env.SITE_URL}/login`
      )
      assert.equal(values.has("comit-session"), false)
    } finally {
      for (const name of ["SITE_URL", "API_URL"]) {
        if (previous[name] === undefined) delete process.env[name]
        else process.env[name] = previous[name]
      }
    }
  })
}

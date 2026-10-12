const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const { setImmediate } = require("node:timers")
const { URL } = require("node:url")
const { Response } = globalThis
const ts = require("typescript")

function load(filename, mocks, fetch, window) {
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
      fetch,
      window,
    },
    { filename }
  )
  return module.exports
}
for (const app of ["web", "admin"]) {
  test(`${app} calls the public API with cookies and keeps unauthorized redirect behavior`, async () => {
    const previous = { ...process.env }
    process.env.SITE_URL = `https://${app}.example`
    process.env.NEXT_PUBLIC_API_URL = "https://api.example/"
    const requests = []
    const redirects = []
    let status = 200
    const root = path.join(__dirname, "../../", app)
    const backend = load(path.join(root, "lib/backend.ts"), {})
    const fetch = async (url, init) => {
      requests.push({ url, init })
      return Response.json(
        status === 200 ? { id: "test" } : { message: "거부" },
        { status }
      )
    }
    const client = load(
      path.join(root, "lib/api.ts"),
      { "./backend": backend },
      fetch,
      { location: { replace: (url) => redirects.push(url) } }
    )
    try {
      const login = new URL(backend.loginUrl())
      assert.equal(login.origin, "https://api.example")
      assert.equal(login.pathname, "/auth/login")
      assert.equal(login.searchParams.get("origin"), process.env.SITE_URL)
      assert.equal(
        login.searchParams.get("destination"),
        app === "web" ? "/my" : "/"
      )
      assert.equal(
        backend.apiUrl("auth/logout"),
        "https://api.example/auth/logout"
      )
      assert.equal((await client.api("users/me")).id, "test")
      assert.equal(requests[0].url, "https://api.example/users/me")
      assert.equal(requests[0].init.credentials, "include")
      assert.equal(requests[0].init.cache, "no-store")
      await client.api("memberships/test", { version: 1 }, "PATCH")
      assert.equal(requests[1].init.method, "PATCH")
      assert.deepEqual(JSON.parse(requests[1].init.body), { version: 1 })
      status = 401
      await assert.rejects(
        client.api("users/me", undefined, "GET", {
          redirectOnUnauthorized: false,
        })
      )
      assert.equal(redirects.length, 0)
      void client.api("users/me")
      await new Promise((resolve) => setImmediate(resolve))
      assert.deepEqual(redirects, ["/login"])
      status = 403
      await assert.rejects(client.api("users"), /거부/)
      assert.equal(redirects.length, 1)
      delete process.env.SITE_URL
      assert.throws(() => backend.loginUrl(), /SITE_URL/)
      for (const file of [
        "lib/session.ts",
        "app/auth/login/route.ts",
        "app/auth/callback/route.ts",
        "app/auth/logout/route.ts",
        "app/api/backend/[...path]/route.ts",
      ])
        assert.equal(fs.existsSync(path.join(root, file)), false)
    } finally {
      for (const name of ["SITE_URL", "NEXT_PUBLIC_API_URL"]) {
        if (previous[name] === undefined) delete process.env[name]
        else process.env[name] = previous[name]
      }
    }
  })
}

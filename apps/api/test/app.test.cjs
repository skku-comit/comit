const assert = require("node:assert/strict")
const { spawn } = require("node:child_process")
const { once } = require("node:events")
const net = require("node:net")
const path = require("node:path")
const { test } = require("node:test")
const { setTimeout: delay } = require("node:timers/promises")

test(
  "HTTP API serves Swagger documentation and preserves authentication",
  { timeout: 15000 },
  async () => {
    const probe = net.createServer()
    probe.listen(0, "127.0.0.1")
    await once(probe, "listening")
    const port = probe.address().port
    await new Promise((resolve) => probe.close(resolve))
    const child = spawn(
      process.execPath,
      [path.join(__dirname, "../dist/main.js")],
      {
        env: { ...process.env, PORT: String(port) },
        stdio: ["ignore", "pipe", "pipe"],
      }
    )
    let output = ""
    child.stdout.on("data", (chunk) => {
      output += chunk
    })
    child.stderr.on("data", (chunk) => {
      output += chunk
    })
    try {
      let response
      for (let attempt = 0; attempt < 100; attempt++) {
        assert.equal(child.exitCode, null, output)
        try {
          response = await fetch(`http://127.0.0.1:${port}/`)
          break
        } catch {
          await delay(100)
        }
      }
      assert.ok(response, output || "API did not start")
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { message: "comit API" })

      const origin = `http://127.0.0.1:${port}`
      const ui = await fetch(`${origin}/docs`)
      assert.equal(ui.status, 200)
      assert.match(await ui.text(), /swagger-ui/)
      const assets = await fetch(`${origin}/docs/swagger-ui-bundle.js`)
      assert.equal(assets.status, 200)
      assert.ok((await assets.arrayBuffer()).byteLength > 0)
      const specResponse = await fetch(`${origin}/docs-json`)
      assert.equal(specResponse.status, 200)
      const spec = await specResponse.json()
      assert.equal(spec.info.title, "comit API")
      assert.equal(spec.components.securitySchemes.bearer.scheme, "bearer")
      const expectedRoutes = {
        "/": ["get"],
        "/auth/login": ["post"],
        "/auth/callback": ["post"],
        "/auth/logout": ["post"],
        "/users/me": ["get"],
        "/users": ["get", "post"],
        "/users/{id}": ["patch"],
        "/users/{id}/memberships": ["get"],
        "/semesters/current": ["get"],
        "/semesters": ["get", "post"],
        "/semesters/{id}": ["patch"],
        "/semesters/{id}/activate": ["post"],
        "/memberships/me": ["get"],
        "/memberships": ["get", "post"],
        "/memberships/{id}": ["get", "patch"],
        "/memberships/historical": ["post"],
        "/memberships/{id}/actions": ["post"],
        "/studies": ["get", "post"],
        "/studies/me": ["get"],
        "/studies/admin": ["get", "post"],
        "/studies/admin/{id}": ["patch"],
        "/studies/{id}": ["get", "patch"],
        "/studies/{id}/manage": ["get"],
        "/studies/{id}/review": ["post"],
        "/studies/{id}/applications": ["post"],
        "/studies/{id}/applications/{applicationId}/actions": ["post"],
      }
      assert.deepEqual(
        Object.keys(spec.paths).sort(),
        Object.keys(expectedRoutes).sort()
      )
      const publicRoutes = new Set([
        "get /",
        "post /auth/login",
        "post /auth/callback",
        "post /auth/logout",
        "get /semesters/current",
        "get /studies",
        "get /studies/{id}",
      ])
      for (const [path, methods] of Object.entries(expectedRoutes)) {
        for (const method of methods) {
          const operation = spec.paths[path][method]
          assert.ok(operation, `${method} ${path}`)
          assert.ok(operation.summary)
          assert.ok(
            operation.responses[
              method === "post" && !path.startsWith("/auth/") ? 201 : 200
            ].content["application/json"].schema
          )
          if (publicRoutes.has(`${method} ${path}`)) {
            assert.ok(!operation.security?.length)
          } else {
            assert.deepEqual(operation.security, [{ bearer: [] }])
          }
          for (const parameter of operation.parameters.filter(
            (p) => p.in === "path"
          )) {
            assert.equal(parameter.required, true)
            assert.equal(parameter.schema.format, "uuid")
          }
          if (method === "post" || method === "patch") {
            if (!path.endsWith("/activate")) {
              assert.equal(operation.requestBody.required, true)
              assert.equal(
                operation.requestBody.content["application/json"].schema.type,
                "object"
              )
            }
          }
        }
      }
      const profile =
        spec.paths["/users"].post.requestBody.content["application/json"].schema
      assert.ok(profile.required.includes("studentId"))
      assert.ok(!profile.required.includes("academicOther"))
      const study =
        spec.paths["/studies/{id}"].get.responses[200].content[
          "application/json"
        ].schema
      assert.ok(!("representativeId" in study.properties))
      assert.ok(!("reason" in study.properties))
      const managed =
        spec.paths["/studies/{id}/manage"].get.responses[200].content[
          "application/json"
        ].schema
      assert.ok("representativeId" in managed.properties.study.properties)
      const filters = spec.paths["/memberships"].get.parameters.filter(
        (p) => p.in === "query"
      )
      assert.deepEqual(filters.map((p) => p.name).sort(), [
        "page",
        "payment",
        "search",
        "semesterId",
        "status",
        "type",
      ])
      assert.ok(filters.every((p) => !p.required))
      // Swagger 설정이 기존 인증 가드를 우회하지 않는지 확인한다.
      const unauthorized = await fetch(`${origin}/users/me`)
      assert.equal(unauthorized.status, 401)
      assert.equal((await unauthorized.json()).statusCode, 401)
    } finally {
      if (child.exitCode === null) {
        const exited = once(child, "exit")
        child.kill("SIGTERM")
        await exited
      }
    }
  }
)

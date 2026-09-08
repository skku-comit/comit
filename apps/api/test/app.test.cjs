const assert = require("node:assert/strict")
const { spawn } = require("node:child_process")
const { once } = require("node:events")
const net = require("node:net")
const path = require("node:path")
const { test } = require("node:test")
const { setTimeout: delay } = require("node:timers/promises")

test("GET / returns the initial API response", { timeout: 15000 }, async () => {
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
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, "exit")
      child.kill("SIGTERM")
      await exited
    }
  }
})

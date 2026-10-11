const fs = require("node:fs")
const ts = require("typescript")
require("reflect-metadata")
// Test original services without depending on Nest's bundled application output.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
    },
    fileName: filename,
  })
  module._compile(outputText, filename)
}

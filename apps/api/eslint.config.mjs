import { config } from "@comit/eslint-config/base"

export default [
  ...config,
  {
    files: ["**/*.ts", "**/*.cjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        fetch: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
        setTimeout: "readonly",
      },
    },
  },
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]

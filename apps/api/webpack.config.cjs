const path = require("node:path")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")

module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    plugins: [
      ...(options.resolve?.plugins ?? []),
      new TsconfigPathsPlugin({
        configFile: path.join(__dirname, "tsconfig.json"),
      }),
    ],
  },
})

import type { StorybookConfig } from "@storybook/react-vite"
import tailwindcss from "@tailwindcss/vite"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx", "../src/docs/**/*.mdx"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  framework: "@storybook/react-vite",
  previewHead: (head) =>
    `${head}<script>document.documentElement.lang = "ko";</script>`,
  async viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    return config
  },
}
export default config

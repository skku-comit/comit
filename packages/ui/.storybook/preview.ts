import { withThemeByClassName } from "@storybook/addon-themes"
import type { Preview } from "@storybook/react-vite"

import "./preview.css"

const preview: Preview = {
  tags: ["autodocs"],
  decorators: [
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile: { name: "모바일", styles: { width: "375px", height: "812px" } },
        desktop: {
          name: "데스크톱",
          styles: { width: "1280px", height: "900px" },
        },
      },
    },
  },
}
export default preview

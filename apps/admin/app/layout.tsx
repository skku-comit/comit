import type { Metadata } from "next"

import "@comit/ui/globals.css"

import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "comit admin",
  description: "운영자용 웹",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className="font-sans antialiased">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

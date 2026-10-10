import type { Metadata } from "next"

import "@comit/ui/globals.css"

import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "CoMit | 함께 배우는 프로그래밍·AI 동아리",
  description:
    "성균관대학교 자연과학캠퍼스 중앙 프로그래밍·AI 동아리 코밋. 스터디, 에이전틱 코딩, 프로젝트와 교류 활동을 만나보세요.",
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

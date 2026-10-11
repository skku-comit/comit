export interface ActivityLink {
  label: string
  href: string
}

interface ActivityContent {
  slug: string
  title: string
  summary: string
  paragraphs: string[]
  links?: ActivityLink[]
}

export interface SessionContent extends ActivityContent {
  schedule?: string
  location?: string
}

export interface ProjectContent extends ActivityContent {
  status?: string
  tags?: string[]
}

// 실제 활동이 확정되면 이 목록에 콘텐츠를 등록한다.
export const sessions: SessionContent[] = []
export const projects: ProjectContent[] = []

export const activitySections = {
  sessions: {
    title: "바이브 코딩 세션",
    caption: "VIBE CODING SESSIONS",
    description: "AI 도구로 아이디어를 구현하고, 함께 배우며 경험을 나눠요.",
    empty:
      "세션 일정과 활동 내용을 준비하고 있어요. 새로운 세션이 열리면 이곳에서 안내할게요.",
    items: sessions,
  },
  projects: {
    title: "프로젝트",
    caption: "COMIT PROJECTS",
    description: "함께 고민하고 만들며, 배운 것을 실제 결과물로 이어가요.",
    empty:
      "코밋의 프로젝트를 소개할 준비를 하고 있어요. 활동과 결과물을 이곳에서 만나보세요.",
    items: projects,
  },
} as const

export type ActivityKind = keyof typeof activitySections

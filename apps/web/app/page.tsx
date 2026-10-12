import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Code2,
  Cpu,
  Users,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import styles from "./page.module.css"

export const metadata: Metadata = {
  title: "CoMit | 성균관대학교 프로그래밍·AI 동아리",
  description:
    "점들을 연결하여 더 넓은 네트워크로. 성균관대학교 중앙 프로그래밍·AI 동아리 코밋에서 사람과 지식, 경험을 연결하며 함께 성장하세요.",
}

const activities = [
  {
    icon: BookOpen,
    title: "스터디",
    label: "STUDY",
    code: "learn(together)",
    href: "/studies",
  },
  {
    icon: Cpu,
    title: "AI 세션",
    label: "AI & BUILD",
    code: "idea → reality",
    href: "/sessions",
  },
  {
    icon: Code2,
    title: "프로젝트",
    label: "PROJECT",
    code: "git commit",
    href: "/projects",
  },
  {
    icon: Users,
    title: "커뮤니티",
    label: "COMMUNITY",
    code: "you + us",
    href: "/join",
  },
]
const history = [
  {
    year: "2026",
    title: "프로그래밍에서 AI까지",
    items: ["AI 리브랜딩", "SKYSH 해커톤", "에이전틱 코딩 세션"],
  },
  {
    year: "2023",
    title: "중앙동아리로 한 걸음",
    items: ["중앙동아리 승격", "명품 스터디클럽 선정", "MOD 협업"],
  },
  {
    year: "2019",
    title: "CoMit의 시작",
    items: ["CoMit 창립", "함께 코딩을 배우는 모임의 시작"],
  },
]
export default function Page() {
  return (
    <div className={styles.page}>
      <section id="about" className={styles.hero} aria-labelledby="about-title">
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroCode} aria-hidden="true">
          <span>const network = &#123;</span>
          <span> people: &quot;CoMit&quot;,</span>
          <span> connect: &quot;together&quot;,</span>
          <span> possibilities: Infinity</span>
          <span>&#125;</span>
        </div>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>SINCE 2019 · SUNGKYUNKWAN UNIVERSITY</p>
          <h1 id="about-title">
            about_
            <br />
            <span className={styles.brace}>&#123; </span>CoMit
            <span className={styles.brace}> &#125;</span>
          </h1>
          <p className={styles.heroDescription}>
            서로 다른 관심사와 경험이 만나는 곳, 코밋.
            <br />
            사람과 지식을 잇고, 함께할 수 있는 일을 넓혀가는
            <br className={styles.desktopBreak} /> 성균관대학교 중앙 프로그래밍
            · AI 동아리입니다.
          </p>
          <a
            href="#intro"
            className={styles.scrollLink}
            aria-label="코밋 소개 더 알아보기"
          >
            <ArrowDown aria-hidden="true" />
          </a>
        </div>
        <span className={styles.heroFooter} aria-hidden="true">
          CoMit. Connect. Grow.
        </span>
      </section>

      <section
        id="intro"
        className={styles.intro}
        aria-labelledby="intro-title"
      >
        <h2 id="intro-title">
          점들을 연결하여
          <br />더 넓은 네트워크로<span className={styles.accent}>.</span>
        </h2>
        <p className={styles.description}>
          전공도, 출발점도 달라도 괜찮습니다.
          <br />
          코밋은 성균관대학교 자연과학캠퍼스에서
          <br className={styles.desktopBreak} /> 프로그래밍과 AI에 대한 관심으로
          모여,
          <br className={styles.desktopBreak} /> 서로의 배움과 도전을
          연결합니다.
        </p>
        <div className={styles.marquee} aria-hidden="true">
          <div className={styles.track}>
            {[0, 1].map((copy) => (
              <span key={copy}>
                # 프로그래밍 &nbsp; # 지식 공유 &nbsp; # 성균관대학교 &nbsp; #
                AI &nbsp; # 연결 &nbsp;{" "}
              </span>
            ))}
          </div>
          <div className={`${styles.track} ${styles.reverse}`}>
            {[0, 1].map((copy) => (
              <span key={copy}>
                # COMIT &nbsp; # 전공을 넘어 &nbsp; # 함께 만들기 &nbsp; #
                호기심 &nbsp; # 네트워크 &nbsp;{" "}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        id="activities"
        className={`${styles.container} ${styles.section}`}
        aria-labelledby="activities-title"
      >
        <h2 id="activities-title">활동</h2>
        <div className={styles.activities}>
          {activities.map(({ icon: Icon, title, label, code, href }, index) => (
            <Link key={label} href={href} className={styles.activity}>
              <div
                className={`${styles.activityArt} ${styles[`art${index}`]}`}
                aria-hidden="true"
              >
                <span className={styles.artLabel}>COMIT / {label}</span>
                <Icon />
                <span className={styles.artCode}>{code}</span>
                <span className={styles.artNumber}>0{index + 1}</span>
              </div>
              <div className={styles.activityBody}>
                <h3>
                  {title}
                  <ArrowRight aria-hidden="true" />
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="history"
        className={styles.history}
        aria-labelledby="history-title"
      >
        <div className={`${styles.container} ${styles.historyLayout}`}>
          <div>
            <p className={styles.eyebrow}>OUR HISTORY</p>
            <h2 id="history-title">
              작은 만남에서,
              <br />더 넓은 연결로.
            </h2>
            <p className={styles.description}>
              함께 코딩하던 첫 모임부터, 새로운 동료와 분야로 연결을 넓혀온
              기록.
            </p>
            <div className={styles.historyMark} aria-hidden="true">
              CoMit
            </div>
          </div>
          <div className={styles.timeline}>
            {history.map(({ year, title, items }) => (
              <article key={year} className={styles.milestone}>
                <p className={styles.year}>{year}</p>
                <h3>{title}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <p className={styles.eyebrow}>YOUR NEXT CONNECTION</p>
        <h2>
          당신의 점을,
          <br />
          코밋과 연결해요<span>.</span>
        </h2>
        <p>
          당신의 관심사가 누군가의 아이디어와 만나, 새로운 배움과 도전으로
          이어집니다.
        </p>
        <Link href="/join" className={styles.joinLink}>
          코밋에서 연결 시작하기 <ArrowRight aria-hidden="true" />
        </Link>
        <p className={styles.closingWord} aria-hidden="true">
          CoMit
        </p>
      </section>
    </div>
  )
}

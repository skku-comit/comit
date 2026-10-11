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
    "다른 시작점, 같은 즐거움. 성균관대학교 중앙 프로그래밍·AI 동아리 코밋의 활동과 성장의 기록을 만나보세요.",
}

const activities = [
  {
    icon: BookOpen,
    title: "함께 배우는 스터디",
    text: "처음 쓰는 코드부터 AI 논문까지. 같은 관심사를 가진 사람들과 차근차근 배워요.",
    label: "STUDY",
    code: "learn(together)",
    href: "/studies",
  },
  {
    icon: Cpu,
    title: "AI와 만드는 새로운 경험",
    text: "에이전틱 코딩 세션에서 AI 도구를 익히고, 아이디어를 직접 구현해요.",
    label: "AI & BUILD",
    code: "idea → reality",
    href: "/sessions",
  },
  {
    icon: Code2,
    title: "아이디어가 프로젝트로",
    text: "프로젝트와 해커톤에서 함께 고민하고 만들며 배운 것을 현실로 옮겨요.",
    label: "PROJECT",
    code: "git commit",
    href: "/projects",
  },
  {
    icon: Users,
    title: "코드 너머의 연결",
    text: "친목 활동부터 홈커밍 데이까지. 서로의 경험을 나누고 오래 이어지는 관계를 만들어요.",
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
          <span>const community = &#123;</span>
          <span> curiosity: true,</span>
          <span> learn: &quot;together&quot;,</span>
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
            다른 시작점, 같은 즐거움.
            <br />
            자유롭게 지식을 나누고, 직접 만들며 성장하는
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
          Code. Summit.
        </span>
      </section>

      <section
        id="intro"
        className={styles.intro}
        aria-labelledby="intro-title"
      >
        <h2 id="intro-title">
          개발자를 꿈꾸는
          <br />
          모든 학생들을 위해서<span className={styles.accent}>.</span>
        </h2>
        <p className={styles.description}>
          호기심으로 모여, 배움으로 연결되는 곳.
          <br />
          코밋은 성균관대학교 자연과학캠퍼스에서
          <br className={styles.desktopBreak} /> 함께 배우고 만드는 즐거움을
          나눕니다.
        </p>
        <div className={styles.marquee} aria-hidden="true">
          <div className={styles.track}>
            {[0, 1].map((copy) => (
              <span key={copy}>
                # 프로그래밍 &nbsp; # SHARE &nbsp; # 성균관대학교 &nbsp; # AI
                &nbsp; # 함께 성장 &nbsp;{" "}
              </span>
            ))}
          </div>
          <div className={`${styles.track} ${styles.reverse}`}>
            {[0, 1].map((copy) => (
              <span key={copy}>
                # COMIT &nbsp; # 전공을 넘어 &nbsp; # BUILD &nbsp; # 호기심
                &nbsp; # LEARN &nbsp;{" "}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.nameSection} aria-labelledby="name-title">
        <div className={styles.container}>
          <div className={styles.nameLayout}>
            <div>
              <p className={styles.eyebrow}>OUR NAME</p>
              <h2 id="name-title">우리의 이름, CoMit</h2>
              <p className={styles.description}>
                코드로 도전하고, 함께 나아간다는 뜻을 담았습니다.
              </p>
            </div>
            <div className={styles.nameMeaning} aria-hidden="true">
              <p className={styles.nameFormula}>
                <span>Code</span>
                <span className={styles.namePlus}>+</span>
                <span>Summit</span>
              </p>
              <p className={styles.nameResult}>
                CoMit<span className={styles.accent}>.</span>
              </p>
            </div>
          </div>
          <dl className={styles.nameDetails}>
            <div>
              <dt>Code + Summit</dt>
              <dd>
                코드를 뜻하는 Code와 정상을 뜻하는 Summit을 합친 이름입니다.
              </dd>
            </div>
            <div>
              <dt>commit</dt>
              <dd>
                코드의 변경 사항을 기록하는 commit과 닮은 발음으로, 프로그래밍
                동아리의 정체성을 담았습니다.
              </dd>
            </div>
            <div>
              <dt>Co + Mit</dt>
              <dd>
                함께를 뜻하는 Co. 함께 배우고 만드는 코밋의 방향을 나타냅니다.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        id="activities"
        className={`${styles.container} ${styles.section}`}
        aria-labelledby="activities-title"
      >
        <p className={styles.eyebrow}>OUR ACTIVITIES</p>
        <h2 id="activities-title">우리는 이렇게 함께해요</h2>
        <p className={styles.description}>배움도, 도전도, 새로운 만남도.</p>
        <div className={styles.activities}>
          {activities.map(
            ({ icon: Icon, title, text, label, code, href }, index) => (
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
                  <p className={styles.eyebrow}>{label}</p>
                  <h3>
                    {title}
                    <ArrowRight aria-hidden="true" />
                  </h3>
                  <p>{text}</p>
                </div>
              </Link>
            )
          )}
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
              작은 시작에서,
              <br />더 넓은 가능성으로.
            </h2>
            <p className={styles.description}>
              코밋이 함께 써 내려온 성장의 기록.
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
        <p className={styles.eyebrow}>YOUR NEXT COMMIT</p>
        <h2>
          다음 이야기는,
          <br />
          당신과 함께<span>.</span>
        </h2>
        <p>함께 배우고, 나누고, 만들어갈 여러분을 기다립니다.</p>
        <Link href="/join" className={styles.joinLink}>
          코밋과 함께하기 <ArrowRight aria-hidden="true" />
        </Link>
        <p className={styles.closingWord} aria-hidden="true">
          CoMit
        </p>
      </section>
    </div>
  )
}

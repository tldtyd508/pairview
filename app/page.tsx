import Link from "next/link";
import { site } from "@/lib/site-data";

const highlights = [
  {
    title: "각자 점수",
    description: "둘의 취향을 따로 남겨서 나중에 다시 비교할 수 있어요.",
  },
  {
    title: "한줄평",
    description: "기억이 흐려지기 전에 짧게 적어 두면 보기 편해요.",
  },
  {
    title: "기록 보관",
    description: "다녀온 곳을 날짜와 함께 차곡차곡 모아 둘 수 있어요.",
  },
];

const guideSteps = [
  "Google 계정으로 로그인해요.",
  "음식점 기록을 남기고 각자 점수를 적어요.",
  "좋았던 순간에는 마커와 사진을 남겨요.",
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-5 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface)] p-4 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:rounded-[2rem] sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--page-border)] bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--page-accent)]" />
              커플 기록
            </div>

            <h1
              className="mt-6 max-w-xl text-4xl font-semibold sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pairview
            </h1>

            <p className="mt-5 max-w-2xl text-xl leading-tight text-[var(--page-text)] sm:text-3xl lg:text-[2.5rem]">
              {site.tagline}
            </p>

            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
              함께 다녀온 곳을 두 사람의 점수와 한줄평으로 남기는 비공개 기록장입니다.
              모바일에서도 바로 열고, 나중에 기록 보관함에서 다시 찾을 수 있어요.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Google로 시작
              </Link>
              <span className="rounded-full border border-[var(--page-border)] bg-white/70 px-4 py-2 text-sm text-[var(--page-text)]">
                각자 점수
              </span>
              <span className="rounded-full border border-[var(--page-border)] bg-white/70 px-4 py-2 text-sm text-[var(--page-text)]">
                한줄평과 기록 보관
              </span>
              <span className="rounded-full border border-[var(--page-border)] bg-white/70 px-4 py-2 text-sm text-[var(--page-text)]">
                둘만 보는 기록
              </span>
            </div>

            <div className="mt-8 grid gap-3 rounded-2xl border border-[var(--page-border)] bg-white/70 p-4 sm:rounded-[1.75rem] sm:p-5">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl bg-[rgba(239,106,76,0.05)] px-4 py-3"
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--page-accent)]" />
                  <div>
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--page-muted)]">
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="grid min-w-0 gap-4">
            <div className="rounded-2xl border border-[var(--page-border)] bg-white/75 p-4 shadow-[0_16px_50px_rgba(48,33,18,0.08)] backdrop-blur-md sm:rounded-[1.75rem] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
                사용 방식
              </p>
              <ol className="mt-5 grid gap-3">
                {guideSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--page-accent-soft)] text-xs font-semibold text-[var(--page-text)]">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-[var(--page-text)]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-[var(--page-border)] bg-[rgba(31,26,22,0.96)] p-4 text-white shadow-[0_16px_50px_rgba(48,33,18,0.22)] sm:rounded-[1.75rem] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                도움말
              </p>
              <p className="mt-4 text-lg font-medium">
                특별히 좋았던 순간에는 마커를 남기고 사진을 붙여 둘 수 있어요.
              </p>
              <p className="mt-4 text-sm leading-6 text-white/72">
                처음에는 음식점 기록만 쓰면 충분합니다. 익숙해지면 기록 보관함에서
                지난 장소를 다시 꺼내 볼 수 있어요.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

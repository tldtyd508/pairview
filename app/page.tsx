import { site } from "@/lib/site-data";
import Link from "next/link";

const highlights = [
  "두 사람의 점수는 따로 기록",
  "한줄평과 히스토리 조회",
  "커플 단위로 완전히 분리",
];

const snapshot = [
  { label: "오늘의 상태", value: "Coming soon" },
  { label: "기준", value: "각자 5점 만점" },
  { label: "마커", value: "셀카각" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.6),transparent_38%)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[var(--page-accent-soft)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-[rgba(79,70,229,0.12)] blur-3xl" />

      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--page-border)] bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--page-accent)]" />
              Coming soon
            </div>

            <h1
              className="mt-6 max-w-xl text-5xl font-semibold tracking-[-0.08em] sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pairview
            </h1>

            <p className="mt-5 max-w-2xl text-2xl leading-tight tracking-[-0.04em] text-[var(--page-text)] sm:text-3xl lg:text-[2.5rem]">
              {site.tagline}
            </p>

            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
              함께한 경험을 두 사람의 시선으로 남기는 비공개 페어 로그.
              먼저 음식점 기록부터 시작하고, 이후에는 애니나 다른 시리즈물
              기록으로도 확장할 수 있게 설계합니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Google로 시작
              </Link>
              {highlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--page-border)] bg-white/70 px-4 py-2 text-sm text-[var(--page-text)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5 shadow-[0_16px_50px_rgba(48,33,18,0.08)] backdrop-blur-md sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
                Snapshot
              </p>
              <div className="mt-5 grid gap-3">
                {snapshot.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl bg-[rgba(239,106,76,0.05)] px-4 py-3"
                  >
                    <span className="text-sm text-[var(--page-muted)]">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-[var(--page-text)]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--page-border)] bg-[rgba(31,26,22,0.96)] p-5 text-white shadow-[0_16px_50px_rgba(48,33,18,0.22)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                Marker rule
              </p>
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div>
                  <div className="text-lg font-medium tracking-[-0.03em]">
                    셀카각
                  </div>
                  <div className="mt-1 text-sm text-white/68">
                    둘 다 4.5점 이상이면 표시
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--page-accent)] text-sm font-semibold text-white">
                  4.5+
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/72">
                마커는 먼저 수동으로 남기고, 나중에 조건형 추천으로 확장한다.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

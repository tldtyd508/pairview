import Link from "next/link";
import { site } from "@/lib/site-data";

const steps = [
  "Google 로그인",
  "커플 초대 링크 생성",
  "첫 음식점 기록 작성",
];

export default function AppHome() {
  return (
    <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center">
        <div className="w-full rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
            Private workspace
          </p>
          <h1
            className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {site.name} workspace
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
            아직 본격적인 입력 화면은 아니고, 로그인 상태를 확인하는
            onboarding 자리다. 다음 단계에서 커플 연결과 첫 기록 입력을
            붙이면 된다.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-muted)]">
                  Step {index + 1}
                </div>
                <div className="mt-2 text-sm font-medium">{step}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/logout"
              className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              Sign out
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
            >
              Public landing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

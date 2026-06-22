import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-[var(--page-text)]">
      <section className="w-full max-w-lg rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-7 text-center shadow-[0_20px_80px_rgba(48,33,18,0.09)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">기록을 찾지 못했다.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--page-muted)]">
          삭제됐거나 접근할 수 없는 주소다. 내 기록 목록에서 다시 찾아볼 수 있다.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/app"
            className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white"
          >
            기록 목록으로
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium"
          >
            홈으로
          </Link>
        </div>
      </section>
    </main>
  );
}

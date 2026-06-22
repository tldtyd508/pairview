"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-[var(--page-text)]">
      <section className="w-full max-w-lg rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-7 text-center shadow-[0_20px_80px_rgba(48,33,18,0.09)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
          Something went wrong
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">화면을 불러오지 못했다.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--page-muted)]">
          연결 상태를 확인하고 다시 시도해 주세요. 문제가 계속되면 홈으로 돌아갈 수 있다.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white"
          >
            다시 시도
          </button>
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

export default function Loading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-5 text-[var(--page-text)]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] px-8 py-7 text-center shadow-[0_20px_80px_rgba(48,33,18,0.09)]">
        <div className="mx-auto h-2 w-24 animate-pulse rounded-full bg-[var(--page-accent)]" />
        <p className="mt-4 text-sm text-[var(--page-muted)]">기록을 불러오는 중...</p>
      </div>
    </main>
  );
}

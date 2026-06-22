import Link from "next/link";
import LoginPanel from "./login-panel";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const e2eMode = process.env.PAIRVIEW_E2E_MODE === "1";

  return (
    <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center">
        <div className="w-full rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
            Sign in
          </p>
          <h1
            className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pairview
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
            Google 로그인으로 시작한다. 로그인되면 `/app`으로 보내고, 첫
            작업에서는 onboarding 자리만 보여준다.
          </p>

          <div className="mt-8">
            <LoginPanel nextPath={params?.next} error={params?.error} e2eMode={e2eMode} />
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--page-muted)] underline-offset-4 hover:underline"
            >
              public landing으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

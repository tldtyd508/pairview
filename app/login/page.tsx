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
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  return (
    <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center">
        <div className="w-full rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
            로그인
          </p>
          <h1
            className="mt-4 text-4xl font-semibold sm:text-6xl"
          >
            Pairview
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
            Google 계정으로 로그인하면 Pairview 공간으로 이동해요. 커플이 없으면
            처음 설정 화면이 열립니다.
          </p>

          <div className="mt-8">
            <LoginPanel
              nextPath={params?.next}
              error={params?.error}
              e2eMode={e2eMode}
              googleClientId={googleClientId}
            />
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--page-muted)] underline-offset-4 hover:underline"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

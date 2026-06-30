import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/auth/server";
import { getFixtureAuthUserId, isE2EMode } from "@/lib/e2e-fixture";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type JoinPageProps = {
  searchParams?: Promise<SearchParams>;
};

function joinTarget(code: string) {
  return `/join?code=${encodeURIComponent(code)}`;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const code = typeof params?.code === "string" ? params.code.trim().toUpperCase() : "";

  if (code) {
    let userId: string | null = null;

    if (isE2EMode()) {
      userId = getFixtureAuthUserId(await cookies());
    } else {
      const supabase = await createSupabaseServerClient();
      userId = await getAuthenticatedUserId(supabase);
    }

    if (!userId) {
      redirect(`/login?next=${encodeURIComponent(joinTarget(code))}`);
    }
  }

  const error = typeof params?.error === "string" ? params.error : null;

  if (!code) {
    return (
      <main className="min-h-screen px-4 py-5 text-[var(--page-text)] sm:px-8 sm:py-8">
        <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center">
          <div className="w-full rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface)] p-5 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:rounded-[2rem] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
              초대 링크
            </p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-5xl">링크가 필요해요</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--page-muted)]">
              초대 링크를 열면 바로 합류할 수 있어요. 링크가 없다면 대시보드에서
              초대 링크를 공유해 달라고 요청해 주세요.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                대시보드로
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
              >
                로그인으로
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center">
        <div className="w-full rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface)] p-5 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:rounded-[2rem] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
            초대 링크
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-5xl">커플에 합류하기</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--page-muted)]">
            링크를 받았다면 이 커플에 바로 들어갈 수 있어요. 합류가 끝나면 대시보드로
            이동합니다.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-[var(--page-border)] bg-white/80 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--page-muted)]">
              초대 코드
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[0.18em]">{code}</div>
            <div className="mt-2 text-sm text-[var(--page-muted)]">
              한 번만 쓰는 링크예요. 이미 사용됐거나 만료됐으면 아래 오류가 표시돼요.
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm text-[var(--page-muted)]">
                {error}
              </div>
            ) : null}

            <form action="/api/pairs/join" method="post" className="mt-5 grid gap-4">
              <input type="hidden" name="code" value={code} />
              <button
                type="submit"
                className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                커플에 합류하기
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
            >
              다른 초대 입력하기
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

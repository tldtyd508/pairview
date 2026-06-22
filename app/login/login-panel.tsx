"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/redirect";

type LoginPanelProps = {
  nextPath?: string | null;
  error?: string | null;
};

export default function LoginPanel({ nextPath, error }: LoginPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(safeNextPath(nextPath));
        return;
      }

      setRedirecting(false);
    });
  }, [nextPath, router]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const errors: Record<string, string> = {
      callback: "로그인 처리를 끝내지 못했다. 다시 시도해라.",
      "missing-code": "로그인 코드가 없어 callback을 끝내지 못했다.",
    };

    setMessage(errors[error] ?? "로그인에 실패했다.");
  }, [error]);

  async function handleGoogleSignIn() {
    const supabase = createSupabaseBrowserClient();
    setLoading(true);
    setMessage(null);

    const redirectTo = new URL(
      `/auth/callback?next=${encodeURIComponent(safeNextPath(nextPath))}`,
      window.location.origin,
    ).toString();

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (signInError) {
      setMessage(signInError.message);
      setLoading(false);
      return;
    }

    startTransition(() => setMessage("Google로 이동 중이다."));
  }

  if (redirecting) {
    return (
      <div className="rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-4 text-sm text-[var(--page-muted)]">
        이미 로그인된 상태를 확인하는 중이다.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Google 연결 중..." : "Google로 시작"}
      </button>
      {message ? (
        <p className="text-sm leading-6 text-[var(--page-muted)]">{message}</p>
      ) : null}
    </div>
  );
}

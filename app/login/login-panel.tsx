"use client";

import Script from "next/script";
import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/redirect";

type LoginPanelProps = {
  nextPath?: string | null;
  error?: string | null;
  e2eMode?: boolean;
  googleClientId?: string;
};

type CredentialResponse = {
  credential?: string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        nonce: string;
        use_fedcm_for_prompt: boolean;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          type: "standard";
          shape: "pill";
          theme: "outline";
          text: "continue_with";
          size: "large";
          logo_alignment: "left";
          width: number;
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

async function generateNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return { nonce, hashedNonce };
}

export default function LoginPanel({
  nextPath,
  error,
  e2eMode = false,
  googleClientId = "",
}: LoginPanelProps) {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    if (e2eMode) return;

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        startTransition(() => {
          router.replace(safeNextPath(nextPath));
          router.refresh();
        });
        return;
      }

      setRedirecting(false);
    }).catch(() => {
      setRedirecting(false);
    });
  }, [e2eMode, nextPath, router]);

  useEffect(() => {
    if (e2eMode || !error) return;

    const errors: Record<string, string> = {
      callback: "로그인 처리를 끝내지 못했어요. 다시 시도해 주세요.",
      "missing-code": "로그인 정보를 확인하지 못했어요. 다시 시도해 주세요.",
    };

    setMessage(errors[error] ?? "로그인에 실패했어요. 다시 시도해 주세요.");
  }, [e2eMode, error]);

  async function handleCredential(response: CredentialResponse) {
    if (!response.credential || !nonceRef.current) {
      setMessage("Google 인증 정보를 받지 못했어요. 다시 시도해 주세요.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const responseBody = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: response.credential,
        nonce: nonceRef.current,
      }),
    });

    if (!responseBody.ok) {
      setLoading(false);
      setMessage("Google 로그인에 실패했어요. 다시 시도해 주세요.");
      return;
    }

    startTransition(() => {
      router.replace(safeNextPath(nextPath));
      router.refresh();
    });
  }

  async function initializeGoogleSignIn() {
    if (!window.google || !googleButtonRef.current) return;

    if (!googleClientId) {
      setMessage("Google 로그인 설정이 필요해요.");
      setRedirecting(false);
      return;
    }

    const { nonce, hashedNonce } = await generateNonce();
    nonceRef.current = nonce;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleCredential,
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
    });
    googleButtonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      shape: "pill",
      theme: "outline",
      text: "continue_with",
      size: "large",
      logo_alignment: "left",
      width: Math.min(400, Math.max(240, googleButtonRef.current.clientWidth)),
    });
  }

  if (e2eMode) {
    function handleFixtureSignIn() {
      document.cookie = "pairview-fixture-auth=user-a; path=/";
      startTransition(() => router.replace(safeNextPath(nextPath)));
    }

    return (
      <div className="grid gap-4">
        <button
          type="button"
          onClick={handleFixtureSignIn}
          className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white"
        >
          Google로 시작
        </button>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-4 text-sm text-[var(--page-muted)]">
        이미 로그인된 상태를 확인하는 중이에요.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => {
          void initializeGoogleSignIn().catch(() => {
            setMessage("Google 로그인을 초기화하지 못했어요.");
          });
        }}
        onError={() => setMessage("Google 로그인 화면을 불러오지 못했어요.")}
      />
      <div
        ref={googleButtonRef}
        className={loading ? "pointer-events-none min-h-10 opacity-60" : "min-h-10"}
        aria-busy={loading}
      />
      {loading ? <p className="text-sm text-[var(--page-muted)]">로그인 처리 중...</p> : null}
      {message ? (
        <p role="alert" className="text-sm leading-6 text-[var(--page-muted)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}

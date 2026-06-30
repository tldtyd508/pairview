"use client";

import { useEffect, useState } from "react";

type InviteShareActionsProps = {
  code: string;
  joinUrl: string;
};

export function InviteShareActions({ code, joinUrl }: InviteShareActionsProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setStatus("초대 링크를 복사했어요.");
    } catch {
      setStatus("링크를 복사하지 못했어요. 직접 공유해 주세요.");
    }
  }

  async function handleShare() {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title: "Pairview 초대",
        text: "Pairview 초대 링크",
        url: joinUrl,
      });
      setStatus("공유 화면을 열었어요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setStatus("링크를 공유하지 못했어요.");
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--page-text)] transition-transform hover:-translate-y-0.5"
        >
          초대 링크 복사
        </button>
        {canShare ? (
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
          >
            공유하기
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
        <div className="text-xs uppercase tracking-[0.24em] text-white/55">초대 링크</div>
        <a
          href={joinUrl}
          className="mt-2 block break-all text-sm font-medium text-white underline-offset-4 hover:underline"
        >
          {joinUrl}
        </a>
        <div className="mt-2 text-xs text-white/60">초대 코드: {code}</div>
      </div>

      <p className="text-sm text-white/70">
        링크를 복사하거나 공유해서 상대를 초대해요. 코드 입력은 보조 수단으로만 남겨둡니다.
      </p>

      {status ? <p className="text-sm text-white/70">{status}</p> : null}
    </div>
  );
}

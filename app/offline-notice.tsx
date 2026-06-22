"use client";

import { useEffect, useState } from "react";

export default function OfflineNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setOffline(!navigator.onLine);

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-2xl border border-amber-900/10 bg-amber-100 px-4 py-3 text-center text-sm font-medium text-amber-950 shadow-lg"
    >
      인터넷 연결이 끊겼다. 작성 중인 내용을 유지하고 연결 후 다시 시도해 주세요.
    </div>
  );
}

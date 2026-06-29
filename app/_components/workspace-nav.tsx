import Link from "next/link";

type WorkspaceNavProps = {
  active: "dashboard" | "evaluate" | "history";
};

const baseClass =
  "flex-1 rounded-2xl px-4 py-3 text-center text-sm font-medium transition-colors md:flex-none md:rounded-full md:px-5";

const activeClass =
  "border border-transparent bg-[var(--page-accent)] text-white shadow-[0_10px_24px_rgba(239,106,76,0.22)]";
const inactiveClass =
  "border border-[var(--page-border)] bg-white/80 text-[var(--page-text)]";

function navClass(active: boolean) {
  return `${baseClass} ${active ? activeClass : inactiveClass}`;
}

export function WorkspaceNav({ active }: WorkspaceNavProps) {
  return (
    <nav
      aria-label="작업 공간 이동"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--page-border)] bg-[rgba(250,245,241,0.96)] backdrop-blur-md md:static md:border-0 md:bg-transparent md:backdrop-blur-0"
    >
      <div className="mx-auto flex w-full max-w-3xl gap-2 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:max-w-none md:px-0 md:py-0 md:pb-0">
        <Link
          href="/app"
          aria-current={active === "dashboard" ? "page" : undefined}
          className={navClass(active === "dashboard")}
        >
          대시보드
        </Link>
        <Link
          href="/evaluate"
          aria-current={active === "evaluate" ? "page" : undefined}
          className={navClass(active === "evaluate")}
        >
          평가 남기기
        </Link>
        <Link
          href="/history"
          aria-current={active === "history" ? "page" : undefined}
          className={navClass(active === "history")}
        >
          기록 보관함
        </Link>
      </div>
    </nav>
  );
}

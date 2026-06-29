import Link from "next/link";

type WorkspaceNavProps = {
  active: "dashboard" | "evaluate" | "history";
};

const baseClass =
  "rounded-full px-5 py-3 text-sm font-medium transition-colors";

const activeClass = "bg-[var(--page-accent)] text-white";
const inactiveClass =
  "border border-[var(--page-border)] bg-white/70 text-[var(--page-text)]";

function navClass(active: boolean) {
  return `${baseClass} ${active ? activeClass : inactiveClass}`;
}

export function WorkspaceNav({ active }: WorkspaceNavProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/app" className={navClass(active === "dashboard")}>
        대시보드
      </Link>
      <Link href="/evaluate" className={navClass(active === "evaluate")}>
        평가 남기기
      </Link>
      <Link href="/history" className={navClass(active === "history")}>
        기록 보관함
      </Link>
    </div>
  );
}

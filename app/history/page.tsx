import Link from "next/link";
import { redirect } from "next/navigation";
import { HistoryExperienceCard } from "@/app/_components/experience-cards";
import { WorkspaceNav } from "@/app/_components/workspace-nav";
import { getAppState, type AppState } from "@/lib/app-state";
import {
  filterAndSortExperiences,
  parseHistoryFilters,
  type HistoryFilters,
} from "@/lib/history";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type HistoryPageProps = {
  searchParams?: Promise<SearchParams>;
};

const sortOptions = [
  ["recent", "최근 방문"],
  ["oldest", "오래된 방문"],
  ["your_score", "내 점수"],
  ["partner_score", "상대 점수"],
  ["best", "베스트"],
] as const;

const reviewStateOptions = [
  ["all", "전체"],
  ["none", "리뷰 없음"],
  ["one", "한 명만"],
  ["both", "둘 다"],
] as const;

function FilterSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="block text-sm">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
      >
        <option value="">전체</option>
        {options.map(([value, title]) => (
          <option key={value} value={value}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}

function historyEmptyMessage(filters: HistoryFilters) {
  const activeCount =
    Number(Boolean(filters.query)) +
    Number(Boolean(filters.category)) +
    Number(Boolean(filters.marker)) +
    Number(filters.sort !== "recent") +
    Number(filters.reviewState !== "all") +
    Number(filters.minScore !== null) +
    Number(filters.maxScore !== null) +
    Number(Boolean(filters.from)) +
    Number(Boolean(filters.to));

  if (activeCount > 0) {
    return "조건에 맞는 기록이 없다. 필터를 지우거나 검색어를 바꿔라.";
  }

  return "아직 기록이 없다. 평가 화면에서 첫 방문을 저장해라.";
}

function memberPair(state: AppState) {
  const partner = state.members.find((member) => member.user_id !== state.user.id) ?? null;
  return { partner };
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const state = await getAppState();

  if (!state.membership) {
    redirect("/app");
  }

  const { partner } = memberPair(state);
  const filters = parseHistoryFilters(params);
  const filteredExperiences = filterAndSortExperiences(
    state.experiences,
    filters,
    state.user.id,
    partner?.user_id ?? null,
  );
  const filterActive =
    Boolean(filters.query) ||
    Boolean(filters.category) ||
    Boolean(filters.marker) ||
    filters.sort !== "recent" ||
    filters.reviewState !== "all" ||
    filters.minScore !== null ||
    filters.maxScore !== null ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  return (
    <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
            Pair archive
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1
                className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                기록 보관함
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--page-muted)]">
                검색과 필터는 여기에서만 관리한다. 평가 입력은 평가 화면에서 처리한다.
              </p>
            </div>
            <WorkspaceNav active="history" />
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold">히스토리 검색</p>
                <p className="text-sm text-[var(--page-muted)]">
                  평균 점수는 없고, 각자의 리뷰만 나란히 본다.
                </p>
              </div>
              <div className="text-sm text-[var(--page-muted)]">
                {filteredExperiences.length} / {state.experiences.length} records
              </div>
            </div>

            <form method="get" className="mt-5 grid gap-4 rounded-2xl border border-[var(--page-border)] bg-white p-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="block text-sm">
                  검색
                  <input
                    name="q"
                    defaultValue={filters.query}
                    placeholder="음식점, 위치, 메뉴"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm">
                  카테고리
                  <input
                    name="category"
                    defaultValue={filters.category}
                    placeholder="한식"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm">
                  마커
                  <input
                    name="marker"
                    defaultValue={filters.marker}
                    placeholder="셀카"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  />
                </label>
                <FilterSelect
                  label="정렬"
                  name="sort"
                  defaultValue={filters.sort}
                  options={sortOptions}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FilterSelect
                  label="리뷰 상태"
                  name="review_state"
                  defaultValue={filters.reviewState}
                  options={reviewStateOptions}
                />
                <label className="block text-sm">
                  최소 점수
                  <input
                    name="min_score"
                    defaultValue={filters.minScore === null ? "" : String(filters.minScore)}
                    inputMode="decimal"
                    placeholder="4"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  />
                </label>
                <label className="block text-sm">
                  최대 점수
                  <input
                    name="max_score"
                    defaultValue={filters.maxScore === null ? "" : String(filters.maxScore)}
                    inputMode="decimal"
                    placeholder="5"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm">
                    시작일
                    <input
                      name="from"
                      type="date"
                      defaultValue={filters.from}
                      className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    종료일
                    <input
                      name="to"
                      type="date"
                      defaultValue={filters.to}
                      className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                >
                  필터 적용
                </button>
                {filterActive ? (
                  <Link
                    href="/history"
                    className="rounded-full border border-[var(--page-border)] bg-white px-5 py-3 text-sm font-medium text-[var(--page-text)]"
                  >
                    필터 초기화
                  </Link>
                ) : null}
              </div>
            </form>

            {filteredExperiences.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/50 p-6 text-sm text-[var(--page-muted)]">
                {historyEmptyMessage(filters)}
                <div className="mt-3">
                  <Link href="/evaluate" className="font-medium text-[var(--page-text)] underline">
                    평가하러 가기
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {filteredExperiences.map((experience) => (
                  <HistoryExperienceCard
                    key={experience.id}
                    experience={experience}
                    currentUserId={state.user.id}
                    partnerUserId={partner?.user_id ?? null}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              대시보드로
            </Link>
            <Link
              href="/evaluate"
              className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
            >
              평가 남기기
            </Link>
            <Link
              href="/logout"
              className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
            >
              Sign out
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

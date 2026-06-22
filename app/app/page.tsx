import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppState, type AppState, type ExperienceCard } from "@/lib/app-state";
import {
  completionLabel,
  filterAndSortExperiences,
  parseHistoryFilters,
  type HistoryFilters,
} from "@/lib/history";
import type { Json } from "@/lib/supabase/types";
import { site } from "@/lib/site-data";

type SearchParams = Record<string, string | string[] | undefined>;

type AppPageProps = {
  searchParams?: Promise<SearchParams>;
};

const errorMessages: Record<string, string> = {
  authentication_required: "로그인이 필요하다.",
  user_already_in_pair: "이미 다른 pair에 속해 있다.",
  invalid_invitation: "초대 코드가 유효하지 않다.",
  invitation_already_used: "이미 사용된 초대 코드다.",
  invitation_expired: "초대 코드가 만료됐다.",
  self_invitation_not_allowed: "자기 자신이 만든 초대에는 참여할 수 없다.",
  pair_is_full: "이 pair는 이미 2명으로 가득 찼다.",
  "missing-code": "초대 코드를 입력해라.",
  "missing-restaurant-fields": "음식점 정보를 빠짐없이 적어라.",
  "missing-review-fields": "리뷰 점수와 본문을 확인해라.",
  "invalid-score": "점수는 0에서 5 사이여야 한다.",
  "experience-not-found": "해당 기록을 찾지 못했다.",
  "forbidden-review": "이 기록에 대한 리뷰 권한이 없다.",
};

const scoreOptions = Array.from({ length: 11 }, (_, index) => (index / 2).toFixed(1));
const sortOptions = [
  ["recent", "최근 방문"],
  ["oldest", "오래된 방문"],
  ["your_score", "내 점수"],
  ["partner_score", "상대 점수"],
] as const;
const reviewStateOptions = [
  ["all", "전체"],
  ["none", "리뷰 없음"],
  ["one", "한 명만"],
  ["both", "둘 다"],
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatScore(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}

function metadataObject(value: Json | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function textFromMetadata(experience: ExperienceCard, key: string) {
  const metadata = metadataObject(experience.subject?.metadata);
  const raw = metadata && key in metadata ? metadata[key] : null;
  return typeof raw === "string" ? raw : "";
}

function objectFromMetadata(experience: ExperienceCard) {
  return metadataObject(experience.subject?.metadata);
}

function messageFromParams(params: SearchParams | undefined) {
  if (!params) return null;
  const error = typeof params.error === "string" ? params.error : null;
  if (error) return errorMessages[error] ?? error;
  if (params.created === "1") {
    return "첫 방문 기록이 추가됐다. 이제 각자 리뷰를 채워라.";
  }
  if (params.joined === "1") {
    return "초대 코드로 pair에 합류했다.";
  }
  if (params.reviewed === "1") {
    return "리뷰를 저장했다.";
  }
  return null;
}

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

async function ensureSignedIn() {
  const state = await getAppState();
  if (!state.membership) {
    return state;
  }
  return state;
}

function parseExperienceFilters(params: SearchParams | undefined): HistoryFilters {
  return parseHistoryFilters(params);
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

  return "아직 기록이 없다. 첫 방문을 저장해라.";
}

function memberPair(state: AppState) {
  const current = state.members.find((member) => member.user_id === state.user.id) ?? null;
  const partner = state.members.find((member) => member.user_id !== state.user.id) ?? null;
  return { current, partner };
}

export default async function AppHome({ searchParams }: AppPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const state = await ensureSignedIn();

  if (!state.membership) {
    return (
      <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
        <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center">
          <div className="w-full rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
              Pair setup
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {site.name} onboarding
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
              로그인은 끝났고, 이제 pair를 만든다. 여기서 생성한 초대 코드를
              상대에게 보내면 된다.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <form
                action="/api/pairs/create"
                method="post"
                className="rounded-2xl border border-[var(--page-border)] bg-white/70 p-5"
              >
                <p className="text-sm font-semibold">Create a pair</p>
                <label className="mt-4 block text-sm text-[var(--page-muted)]">
                  Pair label
                  <input
                    name="label"
                    placeholder="예: 우리 커플"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-5 rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white"
                >
                  Pair 만들기
                </button>
              </form>

              <form
                action="/api/pairs/join"
                method="post"
                className="rounded-2xl border border-[var(--page-border)] bg-white/70 p-5"
              >
                <p className="text-sm font-semibold">Join with code</p>
                <label className="mt-4 block text-sm text-[var(--page-muted)]">
                  Invitation code
                  <input
                    name="code"
                    placeholder="AB12CD34"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm uppercase outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-5 rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
                >
                  Join pair
                </button>
              </form>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/logout"
                className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Sign out
              </Link>
              <Link
                href="/"
                className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
              >
                Public landing
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { current, partner } = memberPair(state);
  const pairLabel = state.pair?.label ?? "Unlabeled pair";
  const activeInvite = state.invitation?.code ?? null;
  const filters = parseExperienceFilters(params);
  const filteredExperiences = filterAndSortExperiences(
    state.experiences,
    filters,
    state.user.id,
    partner?.user_id ?? null,
  );
  const message = messageFromParams(params);
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
        <div className="grid gap-4">
          <div className="w-full rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
              Private workspace
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {pairLabel}
            </h1>

            {message ? (
              <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
                {message}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-[var(--page-border)] bg-white/70 p-5">
                <p className="text-sm font-semibold">Pair members</p>
                <div className="mt-4 grid gap-3">
                  {state.members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {member.profile?.display_name ?? "Unnamed user"}
                        </div>
                        <div className="text-xs text-[var(--page-muted)]">
                          {member.role}
                        </div>
                      </div>
                      <div className="text-xs text-[var(--page-muted)]">
                        {member.user_id === state.user.id ? "You" : "Partner"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 text-sm text-[var(--page-muted)]">
                  Current member count: {state.members.length}/2
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--page-border)] bg-[rgba(31,26,22,0.96)] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                  Invitation state
                </p>
                <div className="mt-4 text-lg font-medium">
                  {activeInvite ? "Pending invite active" : "No active invite"}
                </div>
                {activeInvite ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/55">
                      Invite code
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-[0.18em]">
                      {activeInvite}
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      Share this once. It becomes invalid after use.
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/70">
                    초대가 끝났거나 아직 생성되지 않았다.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">새 음식점 기록</p>
                  <p className="text-sm text-[var(--page-muted)]">
                    첫 방문만 새 기록으로 만든다. repeat behavior는 다음 단계에서 정한다.
                  </p>
                </div>
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--page-muted)]">
                  restaurant only
                </div>
              </div>

              <form action="/api/experiences" method="post" className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    음식점 이름
                    <input
                      name="restaurant_name"
                      required
                      placeholder="예: 오마카세정원"
                      className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    위치
                    <input
                      name="location"
                      required
                      placeholder="예: 서울 성수동"
                      className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    방문일
                    <input
                      name="visit_date"
                      type="date"
                      required
                      className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    카테고리
                    <input
                      name="category"
                      required
                      placeholder="예: 한식 / 이탈리안"
                      className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                    />
                  </label>
                </div>

                <label className="block text-sm">
                  주문한 메뉴
                  <textarea
                    name="ordered_menus"
                    required
                    rows={3}
                    placeholder="예: 트러플 파스타, 우니 오일 파스타"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  />
                </label>

                <label className="block text-sm">
                  메모
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="선택사항"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  />
                </label>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                  >
                    기록 저장
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">방문 히스토리</p>
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
                      href="/app"
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
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {filteredExperiences.map((experience) => (
                    <ExperienceCardView
                      key={experience.id}
                      experience={experience}
                      currentUserId={state.user.id}
                      partnerUserId={partner?.user_id ?? null}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/logout"
              className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              Sign out
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
            >
              Public landing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ExperienceCardView({
  experience,
  currentUserId,
  partnerUserId,
}: {
  experience: ExperienceCard;
  currentUserId: string;
  partnerUserId: string | null;
}) {
  const currentReview = experience.reviews.find((review) => review.user_id === currentUserId) ?? null;
  const partnerReview = partnerUserId
    ? experience.reviews.find((review) => review.user_id === partnerUserId) ?? null
    : null;
  const metadata = objectFromMetadata(experience);
  const category = typeof metadata?.category === "string" ? metadata.category : "Category n/a";
  const location = typeof metadata?.location === "string" ? metadata.location : "Location unavailable";
  const orderedMenus = typeof metadata?.ordered_menus === "string" ? metadata.ordered_menus : experience.notes ?? "메뉴 정보 없음";

  return (
    <article className="rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-muted)]">
            {experience.subject?.kind ?? "restaurant"}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            <Link href={`/history/${experience.id}`} className="hover:underline">
              {experience.subject?.title ?? "Untitled restaurant"}
            </Link>
          </h2>
          <p className="mt-2 text-sm text-[var(--page-muted)]">
            {location} · {category}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {experience.markers.length === 0 ? (
              <span className="rounded-full border border-[var(--page-border)] px-3 py-1 text-xs text-[var(--page-muted)]">
                marker 없음
              </span>
            ) : (
              experience.markers.map((marker) => (
                <span
                  key={marker.id}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: `${marker.color}1A`,
                    color: marker.color,
                  }}
                >
                  {marker.icon} {marker.name}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="text-sm text-[var(--page-muted)]">
          <div>{formatDate(experience.happened_on)}</div>
          <div className="mt-1">{completionLabel(experience.reviews.length)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--page-border)] bg-[rgba(239,106,76,0.04)] px-4 py-3 text-sm text-[var(--page-muted)]">
        <div className="font-medium text-[var(--page-text)]">주문 메뉴</div>
        <div className="mt-1 whitespace-pre-wrap">{orderedMenus}</div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ReviewPanel
          label="Your review"
          displayName="You"
          review={currentReview}
          currentUser
          experienceId={experience.id}
        />
        <ReviewPanel
          label="Partner review"
          displayName="Partner"
          review={partnerReview}
          currentUser={false}
          experienceId={experience.id}
        />
      </div>
    </article>
  );
}

function ReviewPanel({
  label,
  displayName,
  review,
  currentUser,
  experienceId,
}: {
  label: string;
  displayName: string;
  review: ExperienceCard["reviews"][number] | null;
  currentUser: boolean;
  experienceId: string;
}) {
  if (currentUser) {
    return (
      <section className="rounded-2xl border border-[var(--page-border)] bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-xs text-[var(--page-muted)]">{label}</div>
          </div>
          {review ? (
            <div className="rounded-full bg-[var(--page-accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--page-text)]">
              {formatScore(review.score)}
            </div>
          ) : (
            <div className="rounded-full border border-[var(--page-border)] px-3 py-1 text-xs text-[var(--page-muted)]">
              아직 없음
            </div>
          )}
        </div>

        <form action="/api/reviews" method="post" className="mt-4 grid gap-3">
          <input type="hidden" name="experience_id" value={experienceId} />
          <label className="block text-sm">
            점수
            <select
              name="score"
              defaultValue={review ? review.score.toFixed(1) : "4.0"}
              className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
            >
              {scoreOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            한줄평
            <textarea
              name="body"
              rows={3}
              defaultValue={review?.body ?? ""}
              placeholder="맛, 분위기, 재방문 의사"
              className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-[var(--page-accent)] px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              저장
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--page-border)] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{displayName}</div>
          <div className="text-xs text-[var(--page-muted)]">{label}</div>
        </div>
        {review ? (
          <div className="rounded-full bg-[var(--page-accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--page-text)]">
            {formatScore(review.score)}
          </div>
        ) : (
          <div className="rounded-full border border-[var(--page-border)] px-3 py-1 text-xs text-[var(--page-muted)]">
            아직 없음
          </div>
        )}
      </div>

      {review ? (
        <div className="mt-4 rounded-2xl bg-[rgba(239,106,76,0.04)] px-4 py-3 text-sm leading-6">
          {review.body ? review.body : "한줄평 없음"}
          <div className="mt-2 text-xs text-[var(--page-muted)]">
            {formatTime(review.created_at)}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] px-4 py-3 text-sm text-[var(--page-muted)]">
          아직 리뷰가 없다.
        </div>
      )}
    </section>
  );
}

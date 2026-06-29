import Link from "next/link";
import { HistoryExperienceCard } from "@/app/_components/experience-cards";
import { WorkspaceNav } from "@/app/_components/workspace-nav";
import { getAppState, type AppState } from "@/lib/app-state";
import { filterAndSortExperiences, parseHistoryFilters } from "@/lib/history";
import { site } from "@/lib/site-data";

export const dynamic = "force-dynamic";

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
  "missing-marker-fields": "마커 이름, 색, 아이콘을 확인해라.",
  "missing-photo-fields": "사진과 대상 기록을 확인해라.",
  "invalid-photo-type": "사진은 JPEG, PNG, WebP, AVIF만 된다.",
  "photo-too-large": "사진은 10MB 이하로 올려라.",
  "missing-code": "초대 코드를 입력해라.",
  "missing-restaurant-fields": "음식점 정보를 빠짐없이 적어라.",
  "missing-review-fields": "리뷰 점수와 본문을 확인해라.",
  "invalid-score": "점수는 0에서 5 사이여야 한다.",
  "experience-not-found": "해당 기록을 찾지 못했다.",
  "forbidden-review": "이 기록에 대한 리뷰 권한이 없다.",
};

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
  if (params.marker_created === "1") {
    return "마커를 추가했다.";
  }
  if (params.marker_applied === "1") {
    return "마커를 붙였다.";
  }
  if (params.marker_removed === "1") {
    return "마커를 제거했다.";
  }
  if (params.photo_uploaded === "1") {
    return "사진을 올렸다.";
  }
  if (params.reviewed === "1") {
    return "리뷰를 저장했다.";
  }
  return null;
}

async function ensureSignedIn() {
  return getAppState();
}

function memberPair(state: AppState) {
  const current = state.members.find((member) => member.user_id === state.user.id) ?? null;
  const partner = state.members.find((member) => member.user_id !== state.user.id) ?? null;
  return { current, partner };
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function sortByRecent<T extends { happened_on: string; created_at: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      right.happened_on.localeCompare(left.happened_on) ||
      right.created_at.localeCompare(left.created_at),
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--page-border)] bg-white/70 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--page-muted)]">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value}</div>
      <div className="mt-2 text-sm text-[var(--page-muted)]">{hint}</div>
    </div>
  );
}

function PendingReviewCard({
  experience,
}: {
  experience: AppState["experiences"][number];
}) {
  const metadata =
    experience.subject?.metadata && typeof experience.subject.metadata === "object" && !Array.isArray(experience.subject.metadata)
      ? experience.subject.metadata
      : null;
  const location = typeof metadata?.location === "string" ? metadata.location : "Location unavailable";
  const category = typeof metadata?.category === "string" ? metadata.category : "Category n/a";

  return (
    <article className="rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-muted)]">
            {experience.subject?.kind ?? "restaurant"}
          </div>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            <Link href={`/evaluate?experience=${experience.id}`} className="hover:underline">
              {experience.subject?.title ?? "Untitled restaurant"}
            </Link>
          </h3>
          <p className="mt-2 text-sm text-[var(--page-muted)]">
            {location} · {category}
          </p>
        </div>
        <div className="text-sm text-[var(--page-muted)]">
          <div>{formatDate(experience.happened_on)}</div>
          <div className="mt-1">{experience.reviews.length} / 2 reviews</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--page-border)] bg-[rgba(239,106,76,0.04)] px-4 py-3 text-sm">
        <span className="text-[var(--page-muted)]">평가를 기다리는 기록</span>
        <Link
          href={`/evaluate?experience=${experience.id}`}
          className="rounded-full bg-[var(--page-accent)] px-4 py-2 text-xs font-medium text-white"
        >
          평가하러 가기
        </Link>
      </div>
    </article>
  );
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

  const { partner } = memberPair(state);
  const pairLabel = state.pair?.label ?? "Unlabeled pair";
  const activeInvite = state.invitation?.code ?? null;
  const message = messageFromParams(params);
  const partnerUserId = partner?.user_id ?? null;
  const recentExperiences = sortByRecent(state.experiences).slice(0, 4);
  const bestFilters = parseHistoryFilters({ sort: "best" });
  const bestExperiences = filterAndSortExperiences(
    state.experiences,
    bestFilters,
    state.user.id,
    partnerUserId,
  ).slice(0, 4);
  const pendingExperiences = state.experiences
    .filter((experience) => !experience.reviews.some((review) => review.user_id === state.user.id))
    .slice(0, 4);
  const totalCount = state.experiences.length;
  const pendingCount = state.experiences.filter(
    (experience) => !experience.reviews.some((review) => review.user_id === state.user.id),
  ).length;
  const bothReviewedCount = state.experiences.filter(
    (experience) => experience.reviews.length === 2,
  ).length;
  const markerCount = state.experiences.filter((experience) => experience.markers.length > 0).length;

  return (
    <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="grid gap-4">
          <div className="w-full rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
              Pair dashboard
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {pairLabel}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
              최근 기록, 베스트 기록, 그리고 아직 남기지 않은 평가를 한 화면에서
              다시 꺼내본다.
            </p>

            <div className="mt-6">
              <WorkspaceNav active="dashboard" />
            </div>

            {message ? (
              <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
                {message}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="기록 수"
                value={formatCompactCount(totalCount)}
                hint="우리 pair에 저장된 전체 경험"
              />
              <StatCard
                label="평가 대기"
                value={formatCompactCount(pendingCount)}
                hint="내가 아직 점수와 한줄평을 안 남긴 기록"
              />
              <StatCard
                label="둘 다 평가"
                value={formatCompactCount(bothReviewedCount)}
                hint="두 사람의 취향이 모두 기록된 경험"
              />
              <StatCard
                label="마커 기록"
                value={formatCompactCount(markerCount)}
                hint="셀카 같은 pair 전용 마커가 붙은 기록"
              />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Pair members</p>
                    <p className="text-sm text-[var(--page-muted)]">
                      현재 pair에 속한 사람들
                    </p>
                  </div>
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--page-muted)]">
                    {state.members.length}/2
                  </div>
                </div>
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
                        <div className="text-xs text-[var(--page-muted)]">{member.role}</div>
                      </div>
                      <div className="text-xs text-[var(--page-muted)]">
                        {member.user_id === state.user.id ? "You" : "Partner"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[var(--page-border)] bg-[rgba(31,26,22,0.96)] p-5 text-white">
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">최근 기록</p>
                  <p className="text-sm text-[var(--page-muted)]">
                    막 저장했거나 다시 보고 싶은 기록
                  </p>
                </div>
                <Link
                  href="/history?sort=recent"
                  className="rounded-full border border-[var(--page-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--page-text)]"
                >
                  전체 최근 기록 보기
                </Link>
              </div>

              {recentExperiences.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/50 p-6 text-sm text-[var(--page-muted)]">
                  아직 기록이 없다. 평가 남기기에서 첫 기록을 저장해라.
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {recentExperiences.map((experience) => (
                    <HistoryExperienceCard
                      key={experience.id}
                      experience={experience}
                      currentUserId={state.user.id}
                      partnerUserId={partnerUserId}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">베스트 기록</p>
                  <p className="text-sm text-[var(--page-muted)]">
                    두 사람 모두 높게 준 기록만 모아서 본다
                  </p>
                </div>
                <Link
                  href="/history?sort=best"
                  className="rounded-full border border-[var(--page-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--page-text)]"
                >
                  전체 베스트 보기
                </Link>
              </div>

              {bestExperiences.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/50 p-6 text-sm text-[var(--page-muted)]">
                  둘 다 리뷰한 기록이 아직 없다. `/evaluate`에서 리뷰를 채워라.
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {bestExperiences.map((experience) => (
                    <HistoryExperienceCard
                      key={experience.id}
                      experience={experience}
                      currentUserId={state.user.id}
                      partnerUserId={partnerUserId}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">평가 대기</p>
                  <p className="text-sm text-[var(--page-muted)]">
                    아직 내가 점수와 한줄평을 안 남긴 기록
                  </p>
                </div>
                <Link
                  href="/evaluate"
                  className="rounded-full border border-[var(--page-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--page-text)]"
                >
                  평가하러 가기
                </Link>
              </div>

              {pendingExperiences.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/50 p-6 text-sm text-[var(--page-muted)]">
                  이미 모든 기록을 평가했다. 새 기록을 추가하면 다시 여기로 온다.
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {pendingExperiences.map((experience) => (
                    <PendingReviewCard key={experience.id} experience={experience} />
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

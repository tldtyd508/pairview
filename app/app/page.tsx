import Link from "next/link";
import type { ReactNode } from "react";
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
  authentication_required: "로그인이 필요해요.",
  user_already_in_pair: "이미 다른 커플에 속해 있어요.",
  invalid_invitation: "초대 코드가 유효하지 않아요.",
  invitation_already_used: "이미 사용된 초대 코드예요.",
  invitation_expired: "초대 코드가 만료됐어요.",
  self_invitation_not_allowed: "자기 자신이 만든 초대에는 참여할 수 없어요.",
  pair_is_full: "이 커플에는 이미 두 명이 있어요.",
  "missing-marker-fields": "마커 이름, 색, 아이콘을 확인해 주세요.",
  "missing-photo-fields": "사진과 대상 기록을 확인해 주세요.",
  "invalid-photo-type": "사진은 JPEG, PNG, WebP, AVIF만 가능해요.",
  "photo-too-large": "사진은 10MB 이하로 올려 주세요.",
  "missing-code": "초대 코드를 입력해 주세요.",
  "missing-restaurant-fields": "음식점 정보를 빠짐없이 적어 주세요.",
  "missing-review-fields": "평가 점수와 한줄평을 확인해 주세요.",
  "invalid-score": "점수는 0에서 5 사이여야 해요.",
  "experience-not-found": "해당 기록을 찾지 못했어요.",
  "forbidden-review": "이 기록에 대한 평가 권한이 없어요.",
};

function messageFromParams(params: SearchParams | undefined) {
  if (!params) return null;
  const error = typeof params.error === "string" ? params.error : null;
  if (error) return errorMessages[error] ?? error;
  if (params.created === "1") {
    return "첫 방문 기록이 추가됐어요. 이제 각자 평가를 남기면 돼요.";
  }
  if (params.joined === "1") {
    return "초대 코드로 커플에 합류했어요.";
  }
  if (params.marker_created === "1") {
    return "마커를 추가했어요.";
  }
  if (params.marker_applied === "1") {
    return "마커를 붙였어요.";
  }
  if (params.marker_removed === "1") {
    return "마커를 제거했어요.";
  }
  if (params.photo_uploaded === "1") {
    return "사진을 올렸어요.";
  }
  if (params.reviewed === "1") {
    return "평가를 저장했어요.";
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
    <div className="rounded-[1.5rem] border border-[var(--page-border)] bg-white/80 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--page-muted)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--page-muted)]">{hint}</div>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-[var(--page-muted)]">{subtitle}</p>
      </div>
      {action ? <div>{action}</div> : null}
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
  const location = typeof metadata?.location === "string" ? metadata.location : "위치 정보 없음";
  const category = typeof metadata?.category === "string" ? metadata.category : "카테고리 없음";

  return (
    <article className="rounded-[1.5rem] border border-[var(--page-border)] bg-white/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-muted)]">
            {experience.subject?.kind ?? "음식점"}
          </div>
          <h3 className="mt-2 text-xl font-semibold">
            <Link href={`/evaluate?experience=${experience.id}`} className="hover:underline">
              {experience.subject?.title ?? "이름 없는 음식점"}
            </Link>
          </h3>
          <p className="mt-2 text-sm text-[var(--page-muted)]">
            {location} · {category}
          </p>
        </div>
        <div className="text-sm text-[var(--page-muted)]">
          <div>{formatDate(experience.happened_on)}</div>
          <div className="mt-1">{experience.reviews.length} / 2개 평가</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--page-border)] bg-[rgba(239,106,76,0.04)] px-4 py-3 text-sm">
        <span className="text-[var(--page-muted)]">내 평가가 아직 없어요</span>
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
      <main className="min-h-screen px-4 py-5 pb-28 text-[var(--page-text)] sm:px-8 sm:py-8">
        <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center">
          <div className="w-full min-w-0 rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface)] p-4 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:rounded-[2rem] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
              커플 설정
            </p>
            <h1
              className="mt-4 text-4xl font-semibold sm:text-6xl"
            >
              {site.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
              로그인을 마쳤어요. 이제 커플을 만들거나 초대 코드로 합류하면 둘만의
              기록 공간이 열려요.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <form
                action="/api/pairs/create"
                method="post"
                className="rounded-[1.5rem] border border-[var(--page-border)] bg-white/80 p-5"
              >
                <p className="text-sm font-semibold">커플 만들기</p>
                <label className="mt-4 block text-sm text-[var(--page-muted)]">
                  커플 이름
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
                  커플 만들기
                </button>
              </form>

              <form
                action="/api/pairs/join"
                method="post"
                className="rounded-[1.5rem] border border-[var(--page-border)] bg-white/80 p-5"
              >
                <p className="text-sm font-semibold">초대 코드로 합류</p>
                <label className="mt-4 block text-sm text-[var(--page-muted)]">
                  초대 코드
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
                  합류하기
                </button>
              </form>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/logout"
                className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                로그아웃
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

  const { partner } = memberPair(state);
  const pairLabel = state.pair?.label ?? "이름 없는 커플";
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
    <main className="min-h-screen px-4 py-5 pb-28 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
          <div className="grid min-w-0 gap-4">
            <header className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface)] p-4 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:rounded-[2rem] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
                대시보드
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1
                    className="text-3xl font-semibold sm:text-6xl"
                  >
                    {pairLabel}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
                    최근 기록, 베스트 기록, 그리고 아직 남기지 않은 평가를 한 화면에서
                    바로 볼 수 있어요.
                  </p>
                </div>
                <div className="self-start">
                  <WorkspaceNav active="dashboard" />
                </div>
              </div>

              {message ? (
                <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/80 px-4 py-3 text-sm text-[var(--page-muted)]">
                  {message}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/evaluate"
                  className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                >
                  평가 남기기
                </Link>
                <Link
                  href="/history"
                  className="rounded-full border border-[var(--page-border)] bg-white/80 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
                >
                  기록 보관함
                </Link>
              </div>
            </header>

            <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
              <SectionTitle
                title="평가 대기"
                subtitle="아직 내 평가가 없는 기록부터 먼저 처리해요."
                action={
                  <Link
                    href="/evaluate"
                    className="rounded-full border border-[var(--page-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--page-text)]"
                  >
                    평가 남기기
                  </Link>
                }
              />

              {pendingExperiences.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/60 p-6 text-sm text-[var(--page-muted)]">
                  아직 남길 평가가 없어요. 새 기록이 생기면 여기에 다시 보여요.
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {pendingExperiences.map((experience) => (
                    <PendingReviewCard key={experience.id} experience={experience} />
                  ))}
                </div>
              )}
            </section>

            <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
              <SectionTitle
                title="최근 기록"
                subtitle="방금 저장했거나 다시 보고 싶은 기록이에요."
                action={
                  <Link
                    href="/history?sort=recent"
                    className="rounded-full border border-[var(--page-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--page-text)]"
                  >
                    전체 보기
                  </Link>
                }
              />

              {recentExperiences.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/60 p-6 text-sm text-[var(--page-muted)]">
                  아직 기록이 없어요. 첫 기록을 남기면 여기서 바로 확인할 수 있어요.
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
            </section>

            <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
              <SectionTitle
                title="베스트 기록"
                subtitle="두 사람 모두 높게 준 기록만 모아서 볼 수 있어요."
                action={
                  <Link
                    href="/history?sort=best"
                    className="rounded-full border border-[var(--page-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--page-text)]"
                  >
                    전체 보기
                  </Link>
                }
              />

              {bestExperiences.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/60 p-6 text-sm text-[var(--page-muted)]">
                  아직 두 사람 모두 평가한 기록이 없어요. 둘 다 평가를 남기면 여기에 보여요.
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
            </section>
          </div>

          <aside className="grid min-w-0 gap-4">
            <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
              <p className="text-sm font-semibold">빠른 이동</p>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/evaluate"
                  className="rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--page-text)]"
                >
                  새 기록 남기기
                </Link>
                <Link
                  href="/history?sort=recent"
                  className="rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--page-text)]"
                >
                  최근 기록 보기
                </Link>
                <Link
                  href="/history?sort=best"
                  className="rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--page-text)]"
                >
                  베스트 기록 보기
                </Link>
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
              <p className="text-sm font-semibold">기록 요약</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <StatCard
                  label="기록 수"
                  value={formatCompactCount(totalCount)}
                  hint="커플에 저장된 전체 경험이에요."
                />
                <StatCard
                  label="평가 대기"
                  value={formatCompactCount(pendingCount)}
                  hint="내가 아직 점수와 한줄평을 안 남긴 기록이에요."
                />
                <StatCard
                  label="둘 다 평가"
                  value={formatCompactCount(bothReviewedCount)}
                  hint="두 사람의 취향이 모두 기록된 경험이에요."
                />
                <StatCard
                  label="마커 기록"
                  value={formatCompactCount(markerCount)}
                  hint="셀카 같은 커플 마커가 붙은 기록이에요."
                />
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-[rgba(31,26,22,0.96)] p-4 text-white sm:rounded-[1.75rem] sm:p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">커플 정보</p>
                  <p className="mt-1 text-sm text-white/70">
                    현재 커플에 속한 사람과 초대 상태를 확인해요.
                  </p>
                </div>
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-white/55">
                  {state.members.length}/2
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {state.members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {member.profile?.display_name ?? "이름 없음"}
                      </div>
                      <div className="text-xs text-white/60">{member.role}</div>
                    </div>
                    <div className="text-xs text-white/60">
                      {member.user_id === state.user.id ? "나" : "상대"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/55">초대 상태</div>
                <div className="mt-2 text-lg font-medium">
                  {activeInvite ? "초대 코드가 활성화되어 있어요" : "활성 초대 코드가 없어요"}
                </div>
                {activeInvite ? (
                  <>
                    <div className="mt-3 text-xs uppercase tracking-[0.24em] text-white/55">
                      초대 코드
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-[0.18em]">
                      {activeInvite}
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      한 번만 공유하면 돼요. 사용되면 더 이상 쓸 수 없어요.
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-white/70">
                    아직 초대 코드가 없거나, 이미 사용된 상태예요.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/logout"
            className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
          >
            로그아웃
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[var(--page-border)] bg-white/80 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}

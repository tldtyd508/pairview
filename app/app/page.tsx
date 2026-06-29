import Link from "next/link";
import { EvaluationExperienceCard } from "@/app/_components/experience-cards";
import { getAppState, type AppState } from "@/lib/app-state";
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
  const state = await getAppState();
  if (!state.membership) {
    return state;
  }
  return state;
}

function memberPair(state: AppState) {
  const partner = state.members.find((member) => member.user_id !== state.user.id) ?? null;
  return { partner };
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
  const selectedExperienceId =
    typeof params?.experience === "string" ? params.experience : null;
  const pendingExperiences = state.experiences.filter(
    (experience) => !experience.reviews.some((review) => review.user_id === state.user.id),
  );
  const selectedExperience = selectedExperienceId
    ? state.experiences.find((experience) => experience.id === selectedExperienceId) ?? null
    : null;
  const evaluationExperiences = [
    ...(selectedExperience ? [selectedExperience] : []),
    ...pendingExperiences.filter((experience) => experience.id !== selectedExperience?.id),
  ].slice(0, 5);

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
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white"
              >
                평가 남기기
              </Link>
              <Link
                href="/history"
                className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
              >
                기록 보관함
              </Link>
            </div>

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

            <div className="mt-4 rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">마커 관리</p>
                  <p className="text-sm text-[var(--page-muted)]">
                    pair 전용 마커를 수동으로 만든다. 초기 셋업은 셀카로 시작하면 된다.
                  </p>
                </div>
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--page-muted)]">
                  pair markers
                </div>
              </div>

              <form action="/api/markers" method="post" className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-[1.2fr_0.7fr_0.8fr]">
                  <label className="block text-sm">
                    이름
                    <input
                      name="name"
                      defaultValue="셀카"
                      placeholder="예: 셀카"
                      className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    아이콘
                    <input
                      name="icon"
                      defaultValue="📸"
                      placeholder="📸"
                      className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-center text-lg outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    색상
                    <input
                      name="color"
                      type="color"
                      defaultValue="#ef6a4c"
                      className="mt-2 h-[52px] w-full rounded-2xl border border-[var(--page-border)] bg-white px-3 py-2 outline-none"
                    />
                  </label>
                </div>

                <label className="block text-sm">
                  설명
                  <input
                    name="description"
                    placeholder="선택사항"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  />
                </label>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                  >
                    마커 추가
                  </button>
                </div>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {state.markers.length === 0 ? (
                  <span className="rounded-full border border-[var(--page-border)] px-3 py-1 text-xs text-[var(--page-muted)]">
                    아직 만든 마커 없음
                  </span>
                ) : (
                  state.markers.map((marker) => (
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
                  <p className="text-sm font-semibold">평가 남기기</p>
                  <p className="text-sm text-[var(--page-muted)]">
                    새로 저장한 기록과 아직 내가 평가하지 않은 기록만 여기서 처리한다.
                  </p>
                </div>
                <Link
                  href="/history"
                  className="rounded-full border border-[var(--page-border)] bg-white px-5 py-3 text-sm font-medium text-[var(--page-text)]"
                >
                  전체 기록 보기
                </Link>
              </div>

              {evaluationExperiences.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/50 p-6 text-sm text-[var(--page-muted)]">
                  지금 평가할 기록이 없다. 새 음식점 기록을 추가하거나 기록 보관함에서 예전 기록을 확인해라.
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {evaluationExperiences.map((experience) => (
                    <EvaluationExperienceCard
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

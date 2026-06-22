import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { site } from "@/lib/site-data";

type SearchParams = {
  created?: string;
  joined?: string;
  reviewed?: string;
  experience?: string;
  error?: string;
};

type AppPageProps = {
  searchParams?: Promise<SearchParams>;
};

type MemberProfile = {
  auth_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type MemberRow = {
  user_id: string;
  role: string;
  created_at: string;
  profile: MemberProfile | null;
};

type ExperienceRow = {
  id: string;
  pair_id: string;
  subject_id: string;
  happened_on: string;
  notes: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

type SubjectRow = {
  id: string;
  pair_id: string;
  kind: string;
  title: string;
  description: string | null;
  metadata: Json;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

type ReviewRow = {
  id: string;
  pair_id: string;
  experience_id: string;
  user_id: string;
  score: number;
  body: string | null;
  created_at: string;
  updated_at: string;
};

type ExperienceCard = ExperienceRow & {
  subject: SubjectRow | null;
  reviews: ReviewRow[];
};

type AppState = {
  user: { id: string };
  membership: { pair_id: string; role: string } | null;
  pair: { id: string; label: string | null; created_at: string } | null;
  members: MemberRow[];
  invitation: {
    code: string;
    created_at: string;
    uses_remaining: number;
    accepted_at: string | null;
    revoked_at: string | null;
    expires_at: string | null;
    created_by_user_id: string;
  } | null;
  experiences: ExperienceCard[];
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

function isPlainObject(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getAppState(): Promise<AppState> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const user = authData.user;

  const { data: membership } = await supabase
    .from("pair_memberships")
    .select("pair_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return {
      user,
      membership: null,
      pair: null,
      members: [],
      invitation: null,
      experiences: [],
    };
  }

  const [pairResult, membershipsResult, invitationResult, experiencesResult, subjectsResult, reviewsResult] =
    await Promise.all([
      supabase
        .from("pairs")
        .select("id, label, created_at")
        .eq("id", membership.pair_id)
        .maybeSingle(),
      supabase
        .from("pair_memberships")
        .select("user_id, role, created_at")
        .eq("pair_id", membership.pair_id)
        .order("created_at", { ascending: true }),
      supabase
        .from("invitations")
        .select("code, created_at, uses_remaining, accepted_at, revoked_at, expires_at, created_by_user_id")
        .eq("pair_id", membership.pair_id)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("uses_remaining", 0)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("experiences")
        .select("id, pair_id, subject_id, happened_on, notes, created_by_user_id, created_at, updated_at")
        .eq("pair_id", membership.pair_id)
        .order("happened_on", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("subjects")
        .select("id, pair_id, kind, title, description, metadata, created_by_user_id, created_at, updated_at")
        .eq("pair_id", membership.pair_id),
      supabase
        .from("reviews")
        .select("id, pair_id, experience_id, user_id, score, body, created_at, updated_at")
        .eq("pair_id", membership.pair_id)
        .order("created_at", { ascending: true }),
    ]);

  const memberIds = (membershipsResult.data ?? []).map((row) => row.user_id);
  const profileResult = memberIds.length
    ? await supabase
        .from("users")
        .select("auth_user_id, display_name, avatar_url")
        .in("auth_user_id", memberIds)
    : { data: [] };

  const profileByAuthId = new Map(
    (profileResult.data ?? []).map((profile) => [profile.auth_user_id, profile]),
  );

  const members: MemberRow[] = (membershipsResult.data ?? []).map((row) => ({
    ...row,
    profile: profileByAuthId.get(row.user_id) ?? null,
  }));

  const subjectById = new Map(
    (subjectsResult.data ?? []).map((subject) => [subject.id, subject]),
  );
  const reviewsByExperienceId = new Map<string, ReviewRow[]>();
  for (const review of reviewsResult.data ?? []) {
    const entries = reviewsByExperienceId.get(review.experience_id) ?? [];
    entries.push(review);
    reviewsByExperienceId.set(review.experience_id, entries);
  }

  const experiences: ExperienceCard[] = (experiencesResult.data ?? []).map(
    (experience) => ({
      ...experience,
      subject: subjectById.get(experience.subject_id) ?? null,
      reviews: reviewsByExperienceId.get(experience.id) ?? [],
    }),
  );

  return {
    user,
    membership,
    pair: pairResult.data ?? null,
    members,
    invitation: invitationResult.data ?? null,
    experiences,
  };
}

export default async function AppHome({
  searchParams,
}: AppPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const state = await getAppState();

  const message =
    params?.error
      ? errorMessages[params.error] ?? params.error
      : params?.created === "1"
        ? "첫 방문 기록이 추가됐다. 이제 각자 리뷰를 채워라."
        : params?.joined === "1"
          ? "초대 코드로 pair에 합류했다."
          : params?.reviewed === "1"
            ? "리뷰를 저장했다."
            : null;

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

            {message ? (
              <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
                {message}
              </div>
            ) : null}

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

  const pairLabel = state.pair?.label ?? "Unlabeled pair";
  const activeInvite = state.invitation?.code ?? null;
  const pendingInviteState = activeInvite ? "Pending invite active" : "No active invite";

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
                <div className="mt-4 text-lg font-medium">{pendingInviteState}</div>
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

            <div className="mt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">방문 히스토리</p>
                  <p className="text-sm text-[var(--page-muted)]">
                    평균 점수는 없고, 각자의 리뷰만 나란히 본다.
                  </p>
                </div>
                <div className="text-sm text-[var(--page-muted)]">
                  {state.experiences.length} records
                </div>
              </div>

              {state.experiences.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/50 p-6 text-sm text-[var(--page-muted)]">
                  아직 기록이 없다. 첫 방문을 저장해라.
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {state.experiences.map((experience) => {
                    const visitedBy =
                      experience.created_by_user_id === state.user.id ? "You" : "Partner";
                    const subject = experience.subject;
                    const subjectMetadata = subject?.metadata && isPlainObject(subject.metadata)
                      ? subject.metadata
                      : null;
                    const partnerReviews = new Map(
                      experience.reviews.map((review) => [review.user_id, review]),
                    );

                    return (
                      <article
                        key={experience.id}
                        className="rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-muted)]">
                              {subject?.kind ?? "restaurant"}
                            </div>
                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                              {subject?.title ?? "Untitled restaurant"}
                            </h2>
                          <p className="mt-2 text-sm text-[var(--page-muted)]">
                            {subject?.description ?? "Location unavailable"} ·{" "}
                            {typeof subjectMetadata?.category === "string"
                              ? subjectMetadata.category
                              : "Category n/a"}
                          </p>
                        </div>

                          <div className="text-sm text-[var(--page-muted)]">
                            <div>{formatDate(experience.happened_on)}</div>
                            <div className="mt-1">{visitedBy}</div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[var(--page-border)] bg-[rgba(239,106,76,0.04)] px-4 py-3 text-sm text-[var(--page-muted)]">
                          <div className="font-medium text-[var(--page-text)]">주문 메뉴</div>
                          <div className="mt-1 whitespace-pre-wrap">
                            {typeof subjectMetadata?.ordered_menus === "string"
                              ? subjectMetadata.ordered_menus
                              : experience.notes ?? "메뉴 정보 없음"}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          {state.members.map((member) => {
                            const existingReview = partnerReviews.get(member.user_id) ?? null;

                            return (
                              <section
                                key={`${experience.id}-${member.user_id}`}
                                className="rounded-2xl border border-[var(--page-border)] bg-white p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-semibold">
                                      {member.profile?.display_name ?? "Unnamed user"}
                                    </div>
                                    <div className="text-xs text-[var(--page-muted)]">
                                      {member.user_id === state.user.id ? "Your review" : "Partner review"}
                                    </div>
                                  </div>
                                  {existingReview ? (
                                    <div className="rounded-full bg-[var(--page-accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--page-text)]">
                                      {formatScore(existingReview.score)}
                                    </div>
                                  ) : (
                                    <div className="rounded-full border border-[var(--page-border)] px-3 py-1 text-xs text-[var(--page-muted)]">
                                      아직 없음
                                    </div>
                                  )}
                                </div>

                                {member.user_id === state.user.id ? (
                                  <form
                                    action="/api/reviews"
                                    method="post"
                                    className="mt-4 grid gap-3"
                                  >
                                    <input
                                      type="hidden"
                                      name="experience_id"
                                      value={experience.id}
                                    />
                                    <label className="block text-sm">
                                      점수
                                      <select
                                        name="score"
                                        defaultValue={
                                          existingReview ? existingReview.score.toFixed(1) : "4.0"
                                        }
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
                                        defaultValue={existingReview?.body ?? ""}
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
                                ) : existingReview ? (
                                  <div className="mt-4 rounded-2xl bg-[rgba(239,106,76,0.04)] px-4 py-3 text-sm leading-6">
                                    {existingReview.body ? existingReview.body : "한줄평 없음"}
                                    <div className="mt-2 text-xs text-[var(--page-muted)]">
                                      {formatTime(existingReview.created_at)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] px-4 py-3 text-sm text-[var(--page-muted)]">
                                    아직 리뷰가 없다.
                                  </div>
                                )}
                              </section>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
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

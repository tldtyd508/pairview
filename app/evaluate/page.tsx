import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { InviteShareActions } from "@/app/_components/invite-share-actions";
import { EvaluationExperienceCard } from "@/app/_components/experience-cards";
import { WorkspaceNav } from "@/app/_components/workspace-nav";
import { getAppState, type AppState } from "@/lib/app-state";
import { buildJoinUrl } from "@/lib/invitations";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type EvaluatePageProps = {
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

export default async function EvaluatePage({ searchParams }: EvaluatePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const state = await ensureSignedIn();

  if (!state.membership) {
    redirect("/app");
  }

  const { partner } = memberPair(state);
  const activeInvite = state.invitation?.code ?? null;
  const activeInviteJoinUrl = activeInvite ? buildJoinUrl(activeInvite) : null;
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
    <main className="min-h-screen px-4 py-5 pb-28 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface)] p-4 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:rounded-[2rem] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
            평가 남기기
          </p>
          <div className="mt-4 grid min-w-0 gap-4">
            <div className="min-w-0">
              <h1
                className="break-keep text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl"
              >
                기록 남기기
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--page-muted)]">
                새 음식점 기록을 남기고, 아직 평가하지 않은 기록부터 차례대로 정리해요.
              </p>
            </div>
            <div className="w-full md:max-w-lg">
              <WorkspaceNav active="evaluate" />
            </div>
          </div>

          {message ? (
            <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/80 px-4 py-3 text-sm text-[var(--page-muted)]">
              {message}
            </div>
          ) : null}

          <div className="mt-8 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
            <div className="grid min-w-0 gap-4">
              <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
                <SectionTitle
                  title="새 음식점 기록"
                  subtitle="기록은 처음 방문 기준으로 남겨요."
                />

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
              </section>

              <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
                <SectionTitle
                  title="평가할 기록"
                  subtitle="아직 내 점수가 비어 있는 기록부터 처리해요."
                  action={
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/app"
                        className="rounded-full border border-[var(--page-border)] bg-white px-5 py-3 text-sm font-medium text-[var(--page-text)]"
                      >
                        대시보드
                      </Link>
                      <Link
                        href="/history"
                        className="rounded-full border border-[var(--page-border)] bg-white px-5 py-3 text-sm font-medium text-[var(--page-text)]"
                      >
                        기록 보관함
                      </Link>
                    </div>
                  }
                />

                {evaluationExperiences.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] bg-white/60 p-6 text-sm text-[var(--page-muted)]">
                    지금 바로 평가할 기록은 없어요. 새 음식점 기록을 추가하면 여기로
                    바로 보여요.
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
              </section>

              <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
                <SectionTitle
                  title="마커 관리"
                  subtitle="특별히 남기고 싶은 순간에 마커를 수동으로 붙일 수 있어요."
                />

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
                      아직 만든 마커가 없어요
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
              </section>
            </div>

            <aside className="grid min-w-0 gap-4">
              <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-[rgba(31,26,22,0.96)] p-4 text-white sm:rounded-[1.75rem] sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                  커플 정보
                </p>
                <div className="mt-4 text-lg font-medium">
                  {activeInvite ? "초대 링크를 공유할 수 있어요" : "활성 초대 코드가 없어요"}
                </div>
                {activeInvite ? (
                  <div className="mt-4">
                    <InviteShareActions code={activeInvite} joinUrl={activeInviteJoinUrl ?? "/app"} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/70">
                    아직 초대 링크가 없거나 이미 사용된 상태예요.
                  </p>
                )}
              </section>

              <section className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-white/80 p-4 sm:rounded-[1.75rem] sm:p-5">
                <p className="text-sm font-semibold">커플 구성원</p>
                <div className="mt-4 grid gap-3">
                  {state.members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {member.profile?.display_name ?? "이름 없음"}
                        </div>
                        <div className="text-xs text-[var(--page-muted)]">{member.role}</div>
                      </div>
                      <div className="text-xs text-[var(--page-muted)]">
                        {member.user_id === state.user.id ? "나" : "상대"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 text-sm text-[var(--page-muted)]">
                  현재 커플 인원: {state.members.length}/2
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
        </div>
      </section>
    </main>
  );
}

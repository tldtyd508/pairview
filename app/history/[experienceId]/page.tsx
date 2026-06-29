import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceNav } from "@/app/_components/workspace-nav";
import { getAppState } from "@/lib/app-state";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type HistoryDetailPageProps = {
  params: Promise<{ experienceId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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

const errorMessages: Record<string, string> = {
  "missing-marker-fields": "마커 정보를 확인해 주세요.",
  "missing-photo-fields": "사진 정보를 확인해 주세요.",
  "invalid-photo-type": "사진은 JPEG, PNG, WebP, AVIF만 가능해요.",
  "photo-too-large": "사진은 10MB 이하로 올려 주세요.",
  experience_not_found: "기록을 찾지 못했어요.",
  "experience-not-found": "기록을 찾지 못했어요.",
  "forbidden-review": "이 기록에 접근할 권한이 없어요.",
};

function messageFromParams(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return null;

  if (params.marker_applied === "1") return "마커를 붙였어요.";
  if (params.marker_removed === "1") return "마커를 제거했어요.";
  if (params.photo_uploaded === "1") return "사진을 올렸어요.";

  const error = typeof params.error === "string" ? params.error : null;
  if (error) return errorMessages[error] ?? "문제를 처리하지 못했어요.";

  return null;
}

export default async function HistoryDetailPage({
  params,
  searchParams,
}: HistoryDetailPageProps) {
  const { experienceId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const state = await getAppState();

  if (!state.membership) {
    redirect("/app");
  }

  const experience = state.experiences.find((entry) => entry.id === experienceId);

  if (!experience) {
    notFound();
  }

  const metadata = metadataObject(experience.subject?.metadata);
  const location = typeof metadata?.location === "string" ? metadata.location : "위치 정보 없음";
  const category = typeof metadata?.category === "string" ? metadata.category : "카테고리 없음";
  const orderedMenus =
    typeof metadata?.ordered_menus === "string"
      ? metadata.ordered_menus
      : experience.notes ?? "메뉴 정보 없음";
  const availableMarkers = state.markers.filter(
    (marker) => !experience.markers.some((entry) => entry.id === marker.id),
  );
  const message = messageFromParams(query);

  return (
    <main className="min-h-screen px-4 py-5 pb-28 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-4xl">
        <div className="min-w-0 rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface)] p-4 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
                기록 상세
              </p>
              <h1
                className="mt-4 text-3xl font-semibold sm:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {experience.subject?.title ?? "이름 없는 음식점"}
              </h1>
              <p className="mt-4 text-base leading-7 text-[var(--page-muted)]">
                {location} · {category}
              </p>
            </div>
            <div className="text-sm text-[var(--page-muted)]">
              <div>{formatDate(experience.happened_on)}</div>
              <div className="mt-1">{experience.markers.length}개 마커</div>
            </div>
          </div>

          <div className="mt-6">
            <WorkspaceNav active="history" />
          </div>

          {message ? (
            <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
              {message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {experience.markers.length === 0 ? (
              <span className="rounded-full border border-[var(--page-border)] px-3 py-1 text-xs text-[var(--page-muted)]">
                마커 없음
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

          <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
            <div className="font-medium text-[var(--page-text)]">주문한 메뉴</div>
            <div className="mt-1 whitespace-pre-wrap">{orderedMenus}</div>
          </div>

          {experience.notes ? (
            <div className="mt-4 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
              <div className="font-medium text-[var(--page-text)]">메모</div>
              <div className="mt-1 whitespace-pre-wrap">{experience.notes}</div>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold">마커 적용</div>
                <div className="text-xs text-[var(--page-muted)]">
                  이 기록에 마커를 수동으로 붙이거나 제거해요.
                </div>
              </div>
              <div className="text-xs text-[var(--page-muted)]">
                {state.markers.length}개 사용 가능
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {experience.markers.length === 0 ? (
                <span className="rounded-full border border-[var(--page-border)] px-3 py-1 text-xs text-[var(--page-muted)]">
                  아직 붙은 마커가 없어요
                </span>
              ) : (
                experience.markers.map((marker) => (
                  <form
                    key={marker.id}
                    action="/api/experience-markers"
                    method="post"
                    className="inline-flex"
                  >
                    <input type="hidden" name="experience_id" value={experience.id} />
                    <input type="hidden" name="marker_id" value={marker.id} />
                    <input type="hidden" name="intent" value="detach" />
                    <button
                      type="submit"
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: `${marker.color}1A`,
                        color: marker.color,
                      }}
                    >
                      {marker.icon} {marker.name} ×
                    </button>
                  </form>
                ))
              )}
            </div>

            <form
              action="/api/experience-markers"
              method="post"
              className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"
            >
              <input type="hidden" name="experience_id" value={experience.id} />
              <input type="hidden" name="intent" value="attach" />
              <label className="block text-sm">
                마커 선택
                <select
                  name="marker_id"
                  defaultValue={availableMarkers[0]?.id ?? ""}
                  className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                  disabled={availableMarkers.length === 0}
                >
                  {availableMarkers.length === 0 ? (
                    <option value="">추가할 마커 없음</option>
                  ) : (
                    availableMarkers.map((marker) => (
                      <option key={marker.id} value={marker.id}>
                        {marker.icon} {marker.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={availableMarkers.length === 0}
                  className="w-full rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  마커 붙이기
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--page-border)] bg-white/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold">사진</div>
                <div className="text-xs text-[var(--page-muted)]">
                  선택한 사진을 이 기록에 연결해요.
                </div>
              </div>
              <div className="text-xs text-[var(--page-muted)]">
                {experience.photoAttachments.length}개 첨부
              </div>
            </div>

            <form
              action="/api/photos"
              method="post"
              encType="multipart/form-data"
              className="mt-4 grid gap-3"
            >
              <input type="hidden" name="experience_id" value={experience.id} />
              <label className="block text-sm">
                사진 파일
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="mt-2 block w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[var(--page-accent)] file:px-4 file:py-2 file:text-sm file:text-white"
                />
              </label>
              <label className="block text-sm">
                설명
                <input
                  name="caption"
                  placeholder="선택사항"
                  className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 outline-none"
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                >
                  사진 업로드
                </button>
              </div>
            </form>

            {experience.photoAttachments.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {experience.photoAttachments.map((attachment) => (
                  <figure
                    key={attachment.id}
                    className="overflow-hidden rounded-2xl border border-[var(--page-border)] bg-white"
                  >
                    {attachment.signed_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.signed_url}
                        alt={attachment.caption ?? "experience photo"}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-[rgba(239,106,76,0.04)] text-sm text-[var(--page-muted)]">
                        사진을 불러올 수 없어요.
                      </div>
                    )}
                    <figcaption className="px-4 py-3 text-sm text-[var(--page-muted)]">
                      <div className="font-medium text-[var(--page-text)]">
                        {attachment.caption ?? "설명 없음"}
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--page-border)] px-4 py-3 text-sm text-[var(--page-muted)]">
                아직 사진이 없어요.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {state.members.map((member) => {
              const review =
                experience.reviews.find((entry) => entry.user_id === member.user_id) ?? null;

              return (
                <section
                  key={member.user_id}
                  className="rounded-2xl border border-[var(--page-border)] bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                    <div className="text-sm font-semibold">
                        {member.profile?.display_name ?? "이름 없음"}
                      </div>
                      <div className="text-xs text-[var(--page-muted)]">
                        {member.user_id === state.user.id ? "나" : "상대"}
                      </div>
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
                      아직 리뷰가 없어요.
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/history"
              className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              기록 보관함
            </Link>
            <Link
              href="/logout"
              className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
            >
              로그아웃
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

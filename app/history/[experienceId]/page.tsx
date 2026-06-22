import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAppState } from "@/lib/app-state";
import type { Json } from "@/lib/supabase/types";

type HistoryDetailPageProps = {
  params: Promise<{ experienceId: string }>;
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

export default async function HistoryDetailPage({
  params,
}: HistoryDetailPageProps) {
  const { experienceId } = await params;
  const state = await getAppState();

  if (!state.membership) {
    redirect("/login");
  }

  const experience = state.experiences.find((entry) => entry.id === experienceId);

  if (!experience) {
    notFound();
  }

  const metadata = metadataObject(experience.subject?.metadata);
  const location = typeof metadata?.location === "string" ? metadata.location : "Location unavailable";
  const category = typeof metadata?.category === "string" ? metadata.category : "Category n/a";
  const orderedMenus = typeof metadata?.ordered_menus === "string" ? metadata.ordered_menus : experience.notes ?? "메뉴 정보 없음";

  return (
    <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-4xl">
        <div className="rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
                History detail
              </p>
              <h1
                className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {experience.subject?.title ?? "Untitled restaurant"}
              </h1>
              <p className="mt-4 text-base leading-7 text-[var(--page-muted)]">
                {location} · {category}
              </p>
            </div>
            <div className="text-sm text-[var(--page-muted)]">
              <div>{formatDate(experience.happened_on)}</div>
              <div className="mt-1">{experience.markers.length} markers</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
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

          <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
            <div className="font-medium text-[var(--page-text)]">주문 메뉴</div>
            <div className="mt-1 whitespace-pre-wrap">{orderedMenus}</div>
          </div>

          {experience.notes ? (
            <div className="mt-4 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
              <div className="font-medium text-[var(--page-text)]">메모</div>
              <div className="mt-1 whitespace-pre-wrap">{experience.notes}</div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {state.members.map((member) => {
              const review = experience.reviews.find((entry) => entry.user_id === member.user_id) ?? null;

              return (
                <section key={member.user_id} className="rounded-2xl border border-[var(--page-border)] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">
                        {member.profile?.display_name ?? "Unnamed user"}
                      </div>
                      <div className="text-xs text-[var(--page-muted)]">
                        {member.user_id === state.user.id ? "You" : "Partner"}
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
                      아직 리뷰가 없다.
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              Back to history
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

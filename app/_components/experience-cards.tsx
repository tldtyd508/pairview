import Link from "next/link";
import type { ExperienceCard } from "@/lib/app-state";
import { completionLabel } from "@/lib/history";
import type { Json } from "@/lib/supabase/types";

const scoreOptions = Array.from({ length: 11 }, (_, index) => (index / 2).toFixed(1));

export function formatDate(value: string) {
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

function objectFromMetadata(experience: ExperienceCard) {
  return metadataObject(experience.subject?.metadata);
}

function experienceDisplayData(experience: ExperienceCard) {
  const metadata = objectFromMetadata(experience);
  const category = typeof metadata?.category === "string" ? metadata.category : "카테고리 없음";
  const location = typeof metadata?.location === "string" ? metadata.location : "위치 정보 없음";
  const orderedMenus =
    typeof metadata?.ordered_menus === "string"
      ? metadata.ordered_menus
      : experience.notes ?? "메뉴 정보 없음";

  return { category, location, orderedMenus };
}

function MarkerList({ experience }: { experience: ExperienceCard }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
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
  );
}

function ReviewSummary({
  label,
  review,
}: {
  label: string;
  review: ExperienceCard["reviews"][number] | null;
}) {
  return (
    <section className="rounded-2xl border border-[var(--page-border)] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-[var(--page-muted)]">평가</div>
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
}

function ReviewFormPanel({
  review,
  experienceId,
}: {
  review: ExperienceCard["reviews"][number] | null;
  experienceId: string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--page-border)] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">나</div>
          <div className="text-xs text-[var(--page-muted)]">내 평가</div>
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

export function EvaluationExperienceCard({
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
  const { category, location, orderedMenus } = experienceDisplayData(experience);

  return (
    <article className="rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-muted)]">
            {experience.subject?.kind ?? "음식점"}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            <Link href={`/history/${experience.id}`} className="hover:underline">
              {experience.subject?.title ?? "이름 없는 음식점"}
            </Link>
          </h2>
          <p className="mt-2 text-sm text-[var(--page-muted)]">
            {location} · {category}
          </p>
          <MarkerList experience={experience} />
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
        <ReviewFormPanel review={currentReview} experienceId={experience.id} />
        <ReviewSummary label="상대" review={partnerReview} />
      </div>
    </article>
  );
}

export function HistoryExperienceCard({
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
  const { category, location, orderedMenus } = experienceDisplayData(experience);

  return (
    <article className="rounded-[1.75rem] border border-[var(--page-border)] bg-white/70 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-muted)]">
            {experience.subject?.kind ?? "음식점"}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            <Link href={`/history/${experience.id}`} className="hover:underline">
              {experience.subject?.title ?? "이름 없는 음식점"}
            </Link>
          </h2>
          <p className="mt-2 text-sm text-[var(--page-muted)]">
            {location} · {category}
          </p>
          <MarkerList experience={experience} />
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
        <ReviewSummary label="나" review={currentReview} />
        <ReviewSummary label="상대" review={partnerReview} />
      </div>
    </article>
  );
}

import type { ExperienceCard } from "@/lib/app-state";

export type HistorySort = "recent" | "oldest" | "your_score" | "partner_score";

export type ReviewStateFilter = "all" | "none" | "one" | "both";

export type HistoryFilters = {
  query: string;
  category: string;
  marker: string;
  sort: HistorySort;
  reviewState: ReviewStateFilter;
  minScore: number | null;
  maxScore: number | null;
  from: string;
  to: string;
};

export function parseHistoryFilters(
  params: Record<string, string | string[] | undefined> | undefined,
): HistoryFilters {
  const get = (key: string) => {
    const value = params?.[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parseNumber = (value: string | undefined) => {
    if (!value) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const sortValue = get("sort");
  const reviewStateValue = get("review_state");

  return {
    query: get("q")?.trim() ?? "",
    category: get("category")?.trim() ?? "",
    marker: get("marker")?.trim() ?? "",
    sort:
      sortValue === "oldest" ||
      sortValue === "your_score" ||
      sortValue === "partner_score"
        ? sortValue
        : "recent",
    reviewState:
      reviewStateValue === "none" ||
      reviewStateValue === "one" ||
      reviewStateValue === "both"
        ? reviewStateValue
        : "all",
    minScore: parseNumber(get("min_score")),
    maxScore: parseNumber(get("max_score")),
    from: get("from")?.trim() ?? "",
    to: get("to")?.trim() ?? "",
  };
}

function isOnOrAfter(happenedOn: string, from: string) {
  return !from || happenedOn >= from;
}

function isOnOrBefore(happenedOn: string, to: string) {
  return !to || happenedOn <= to;
}

function includesText(source: string | null | undefined, query: string) {
  if (!query) return true;
  return (source ?? "").toLowerCase().includes(query);
}

function experienceTextFields(experience: ExperienceCard) {
  const subject = experience.subject;
  const metadata = subject?.metadata;
  const metadataObject =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata
      : null;
  const orderedMenus =
    metadataObject && typeof metadataObject.ordered_menus === "string"
      ? metadataObject.ordered_menus
      : "";
  const location =
    metadataObject && typeof metadataObject.location === "string"
      ? metadataObject.location
      : "";
  const category =
    metadataObject && typeof metadataObject.category === "string"
      ? metadataObject.category
      : "";

  return [
    subject?.title ?? "",
    subject?.description ?? "",
    experience.notes ?? "",
    orderedMenus,
    location,
    category,
    ...experience.markers.map((marker) => marker.name),
  ]
    .join(" ")
    .toLowerCase();
}

function reviewScoreOf(experience: ExperienceCard, userId: string) {
  return experience.reviews.find((review) => review.user_id === userId)?.score ?? null;
}

export function filterAndSortExperiences(
  experiences: ExperienceCard[],
  filters: HistoryFilters,
  currentUserId: string,
  partnerUserId: string | null,
) {
  const query = filters.query.toLowerCase();
  const category = filters.category.toLowerCase();
  const marker = filters.marker.toLowerCase();

  const filtered = experiences.filter((experience) => {
    const subject = experience.subject;
    const metadata = subject?.metadata;
    const metadataObject =
      metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? metadata
        : null;
    const subjectCategory =
      metadataObject && typeof metadataObject.category === "string"
        ? metadataObject.category.toLowerCase()
        : "";
    const subjectMarkers = experience.markers.map((entry) => entry.name.toLowerCase());
    const scores = experience.reviews.map((review) => review.score);
    const myScore = reviewScoreOf(experience, currentUserId);
    const partnerScore = partnerUserId
      ? reviewScoreOf(experience, partnerUserId)
      : null;
    const reviewCount = experience.reviews.length;

    if (!isOnOrAfter(experience.happened_on, filters.from)) return false;
    if (!isOnOrBefore(experience.happened_on, filters.to)) return false;
    if (category && subjectCategory !== category) return false;
    if (marker && !subjectMarkers.some((name) => name.includes(marker))) return false;

    if (filters.reviewState === "none" && reviewCount !== 0) return false;
    if (filters.reviewState === "one" && reviewCount !== 1) return false;
    if (filters.reviewState === "both" && reviewCount !== 2) return false;

    if (filters.minScore !== null || filters.maxScore !== null) {
      const inRange = scores.some((score) => {
        if (filters.minScore !== null && score < filters.minScore) return false;
        if (filters.maxScore !== null && score > filters.maxScore) return false;
        return true;
      });

      if (!inRange) return false;
    }

    if (query && !experienceTextFields(experience).includes(query)) return false;

    if (filters.sort === "your_score" && myScore === null) return false;
    if (filters.sort === "partner_score" && partnerScore === null) return false;

    return true;
  });

  filtered.sort((left, right) => {
    const leftMyScore = reviewScoreOf(left, currentUserId) ?? -1;
    const rightMyScore = reviewScoreOf(right, currentUserId) ?? -1;
    const leftPartnerScore = partnerUserId ? reviewScoreOf(left, partnerUserId) ?? -1 : -1;
    const rightPartnerScore = partnerUserId ? reviewScoreOf(right, partnerUserId) ?? -1 : -1;

    if (filters.sort === "oldest") {
      return left.happened_on.localeCompare(right.happened_on) ||
        left.created_at.localeCompare(right.created_at);
    }

    if (filters.sort === "your_score") {
      return rightMyScore - leftMyScore ||
        right.happened_on.localeCompare(left.happened_on) ||
        right.created_at.localeCompare(left.created_at);
    }

    if (filters.sort === "partner_score") {
      return rightPartnerScore - leftPartnerScore ||
        right.happened_on.localeCompare(left.happened_on) ||
        right.created_at.localeCompare(left.created_at);
    }

    return right.happened_on.localeCompare(left.happened_on) ||
      right.created_at.localeCompare(left.created_at);
  });

  return filtered;
}

export function completionLabel(reviewCount: number) {
  if (reviewCount === 0) return "review 없음";
  if (reviewCount === 1) return "한 명만 리뷰";
  return "둘 다 리뷰";
}

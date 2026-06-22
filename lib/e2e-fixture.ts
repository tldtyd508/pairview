import type {
  AppState,
  ExperienceCard,
  MarkerRow,
  MemberProfile,
  PhotoAttachmentRow,
  ReviewRow,
  SubjectRow,
} from "@/lib/app-state";

const authCookieName = "pairview-fixture-auth";

type PairRow = {
  id: string;
  label: string | null;
  created_at: string;
  created_by_user_id: string;
};

type MembershipRow = {
  pair_id: string;
  user_id: string;
  role: string;
  created_at: string;
};

type InvitationRow = {
  pair_id: string;
  code: string;
  created_at: string;
  uses_remaining: number;
  accepted_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  created_by_user_id: string;
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

type FixtureState = {
  users: Record<string, MemberProfile>;
  pairs: PairRow[];
  memberships: MembershipRow[];
  invitations: InvitationRow[];
  subjects: SubjectRow[];
  experiences: ExperienceRow[];
  reviews: ReviewRow[];
  markers: MarkerRow[];
  experienceMarkers: Array<{
    experience_id: string;
    marker_id: string;
    pair_id: string;
    applied_by_user_id: string;
    applied_at: string;
  }>;
  photoAttachments: PhotoAttachmentRow[];
};

const globalScope = globalThis as typeof globalThis & {
  __pairviewE2EState?: FixtureState;
};

const state: FixtureState =
  globalScope.__pairviewE2EState ??
  (globalScope.__pairviewE2EState = {
    users: {
      "user-a": {
        auth_user_id: "user-a",
        display_name: "User A",
        avatar_url: null,
      },
      "user-b": {
        auth_user_id: "user-b",
        display_name: "User B",
        avatar_url: null,
      },
    },
    pairs: [],
    memberships: [],
    invitations: [],
    subjects: [],
    experiences: [],
    reviews: [],
    markers: [],
    experienceMarkers: [],
    photoAttachments: [],
  });

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `fixture-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function requirePairMembership(userId: string) {
  return state.memberships.find((entry) => entry.user_id === userId) ?? null;
}

function findPair(pairId: string) {
  return state.pairs.find((pair) => pair.id === pairId) ?? null;
}

function currentInvitationForPair(pairId: string) {
  return (
    state.invitations.find(
      (invitation) =>
        invitation.pair_id === pairId &&
        invitation.accepted_at === null &&
        invitation.revoked_at === null &&
        invitation.uses_remaining > 0,
    ) ?? null
  );
}

function buildExperienceCards(pairId: string): ExperienceCard[] {
  const subjectById = new Map(
    state.subjects.filter((subject) => subject.pair_id === pairId).map((subject) => [subject.id, subject]),
  );
  const reviewsByExperienceId = new Map<string, ReviewRow[]>();
  for (const review of state.reviews.filter((entry) => entry.pair_id === pairId)) {
    const entries = reviewsByExperienceId.get(review.experience_id) ?? [];
    entries.push(review);
    reviewsByExperienceId.set(review.experience_id, entries);
  }

  const markerById = new Map(
    state.markers.filter((marker) => marker.pair_id === pairId).map((marker) => [marker.id, marker]),
  );
  const markersByExperienceId = new Map<string, MarkerRow[]>();
  for (const entry of state.experienceMarkers.filter((marker) => marker.pair_id === pairId)) {
    const marker = markerById.get(entry.marker_id);
    if (!marker) continue;
    const list = markersByExperienceId.get(entry.experience_id) ?? [];
    list.push(marker);
    markersByExperienceId.set(entry.experience_id, list);
  }

  const photosByExperienceId = new Map<string, PhotoAttachmentRow[]>();
  for (const attachment of state.photoAttachments.filter((photo) => photo.pair_id === pairId)) {
    const list = photosByExperienceId.get(attachment.experience_id) ?? [];
    list.push(attachment);
    photosByExperienceId.set(attachment.experience_id, list);
  }

  return state.experiences
    .filter((experience) => experience.pair_id === pairId)
    .map((experience) => ({
      ...experience,
      subject: subjectById.get(experience.subject_id) ?? null,
      reviews: reviewsByExperienceId.get(experience.id) ?? [],
      markers: markersByExperienceId.get(experience.id) ?? [],
      photoAttachments: photosByExperienceId.get(experience.id) ?? [],
    }));
}

export function isE2EMode() {
  return process.env.PAIRVIEW_E2E_MODE === "1";
}

export function getFixtureAuthUserId(cookieStore: { get(name: string): { value: string } | undefined }) {
  return cookieStore.get(authCookieName)?.value ?? null;
}

export function seedFixtureAuthCookie() {
  return {
    name: authCookieName,
    value: "user-a",
  };
}

export function buildFixtureAppState(userId: string): AppState {
  const membership = requirePairMembership(userId);
  const pair = membership ? findPair(membership.pair_id) : null;
  const members = membership
    ? state.memberships
        .filter((entry) => entry.pair_id === membership.pair_id)
        .map((entry) => ({
          user_id: entry.user_id,
          role: entry.role,
          created_at: entry.created_at,
          profile: state.users[entry.user_id] ?? null,
        }))
    : [];

  return {
    user: { id: userId },
    membership: membership ? { pair_id: membership.pair_id, role: membership.role } : null,
    pair: pair
      ? {
          id: pair.id,
          label: pair.label,
          created_at: pair.created_at,
        }
      : null,
    members,
    invitation: membership ? currentInvitationForPair(membership.pair_id) : null,
    markers: membership
      ? state.markers.filter((marker) => marker.pair_id === membership.pair_id)
      : [],
    experiences: membership ? buildExperienceCards(membership.pair_id) : [],
  };
}

export function fixtureCreatePair(userId: string, label: string | null) {
  if (requirePairMembership(userId)) {
    return { error: "user_already_in_pair" } as const;
  }

  const pairId = makeId();
  const createdAt = nowIso();
  const pair: PairRow = {
    id: pairId,
    label,
    created_at: createdAt,
    created_by_user_id: userId,
  };
  state.pairs.push(pair);
  state.memberships.push({
    pair_id: pairId,
    user_id: userId,
    role: "owner",
    created_at: createdAt,
  });

  const code = "PAIRVIEW";
  state.invitations.push({
    pair_id: pairId,
    code,
    created_at: createdAt,
    uses_remaining: 1,
    accepted_at: null,
    revoked_at: null,
    expires_at: null,
    created_by_user_id: userId,
  });

  return { pair_id: pairId, invitation_code: code } as const;
}

export function fixtureJoinPair(userId: string, code: string) {
  if (requirePairMembership(userId)) {
    return { error: "user_already_in_pair" } as const;
  }

  const invitation = state.invitations.find((entry) => entry.code === code) ?? null;

  if (!invitation) {
    return { error: "invalid_invitation" } as const;
  }

  if (invitation.revoked_at) {
    return { error: "invalid_invitation" } as const;
  }

  if (invitation.accepted_at || invitation.uses_remaining <= 0) {
    return { error: "invitation_already_used" } as const;
  }

  if (invitation.created_by_user_id === userId) {
    return { error: "self_invitation_not_allowed" } as const;
  }

  const memberCount = state.memberships.filter((entry) => entry.pair_id === invitation.pair_id).length;
  if (memberCount >= 2) {
    return { error: "pair_is_full" } as const;
  }

  state.memberships.push({
    pair_id: invitation.pair_id,
    user_id: userId,
    role: "member",
    created_at: nowIso(),
  });

  invitation.accepted_at = nowIso();
  invitation.uses_remaining = 0;

  return { pair_id: invitation.pair_id } as const;
}

export function fixtureCreateExperience(userId: string, input: {
  restaurantName: string;
  location: string;
  category: string;
  orderedMenus: string;
  visitDate: string;
  notes: string | null;
}) {
  const membership = requirePairMembership(userId);
  if (!membership) return { error: "authentication_required" } as const;

  const subjectId = makeId();
  const experienceId = makeId();
  const createdAt = nowIso();

  state.subjects.push({
    id: subjectId,
    pair_id: membership.pair_id,
    kind: "restaurant",
    title: input.restaurantName,
    description: input.location,
    metadata: {
      location: input.location,
      category: input.category,
      ordered_menus: input.orderedMenus,
      record_mode: "first_visit_only",
    },
    created_by_user_id: userId,
    created_at: createdAt,
    updated_at: createdAt,
  });

  state.experiences.push({
    id: experienceId,
    pair_id: membership.pair_id,
    subject_id: subjectId,
    happened_on: input.visitDate,
    notes: input.notes,
    created_by_user_id: userId,
    created_at: createdAt,
    updated_at: createdAt,
  });

  return { experience_id: experienceId } as const;
}

export function fixtureUpsertReview(userId: string, input: {
  experienceId: string;
  score: number;
  body: string | null;
}) {
  const membership = requirePairMembership(userId);
  if (!membership) return { error: "authentication_required" } as const;

  const experience = state.experiences.find((entry) => entry.id === input.experienceId) ?? null;
  if (!experience || experience.pair_id !== membership.pair_id) {
    return { error: "experience-not-found" } as const;
  }

  const existing = state.reviews.find(
    (review) => review.experience_id === input.experienceId && review.user_id === userId,
  );
  const now = nowIso();

  if (existing) {
    existing.score = input.score;
    existing.body = input.body;
    existing.updated_at = now;
  } else {
    state.reviews.push({
      id: makeId(),
      pair_id: membership.pair_id,
      experience_id: input.experienceId,
      user_id: userId,
      score: input.score,
      body: input.body,
      created_at: now,
      updated_at: now,
    });
  }

  return { experience_id: input.experienceId } as const;
}

export function fixtureCreateMarker(userId: string, input: {
  name: string;
  color: string;
  icon: string;
  description: string | null;
}) {
  const membership = requirePairMembership(userId);
  if (!membership) return { error: "authentication_required" } as const;

  const now = nowIso();
  state.markers.push({
    id: makeId(),
    pair_id: membership.pair_id,
    name: input.name,
    color: input.color,
    icon: input.icon,
    description: input.description,
    is_default: false,
    created_by_user_id: userId,
    created_at: now,
    updated_at: now,
  });

  return { ok: true } as const;
}

export function fixtureAttachMarker(userId: string, input: {
  experienceId: string;
  markerId: string;
}) {
  const membership = requirePairMembership(userId);
  if (!membership) return { error: "authentication_required" } as const;

  const experience = state.experiences.find((entry) => entry.id === input.experienceId) ?? null;
  if (!experience || experience.pair_id !== membership.pair_id) {
    return { error: "experience-not-found" } as const;
  }

  const marker = state.markers.find((entry) => entry.id === input.markerId) ?? null;
  if (!marker || marker.pair_id !== membership.pair_id) {
    return { error: "experience-not-found" } as const;
  }

  const now = nowIso();
  const existing = state.experienceMarkers.find(
    (entry) =>
      entry.experience_id === input.experienceId && entry.marker_id === input.markerId,
  );

  if (!existing) {
    state.experienceMarkers.push({
      experience_id: input.experienceId,
      marker_id: input.markerId,
      pair_id: membership.pair_id,
      applied_by_user_id: userId,
      applied_at: now,
    });
  }

  return { experience_id: input.experienceId } as const;
}

export function fixtureDetachMarker(userId: string, input: {
  experienceId: string;
  markerId: string;
}) {
  const membership = requirePairMembership(userId);
  if (!membership) return { error: "authentication_required" } as const;

  const before = state.experienceMarkers.length;
  state.experienceMarkers = state.experienceMarkers.filter(
    (entry) =>
      !(
        entry.experience_id === input.experienceId &&
        entry.marker_id === input.markerId &&
        entry.pair_id === membership.pair_id
      ),
  );

  if (state.experienceMarkers.length === before) {
    return { error: "experience-not-found" } as const;
  }

  return { experience_id: input.experienceId } as const;
}

export async function fixtureUploadPhoto(userId: string, input: {
  experienceId: string;
  file: File;
  caption: string | null;
}) {
  const membership = requirePairMembership(userId);
  if (!membership) return { error: "authentication_required" } as const;

  const experience = state.experiences.find((entry) => entry.id === input.experienceId) ?? null;
  if (!experience || experience.pair_id !== membership.pair_id) {
    return { error: "experience-not-found" } as const;
  }

  const bytes = Buffer.from(await input.file.arrayBuffer());
  const signedUrl = `data:${input.file.type};base64,${bytes.toString("base64")}`;
  const now = nowIso();
  const sortOrder =
    state.photoAttachments
      .filter((attachment) => attachment.experience_id === input.experienceId)
      .reduce((max, attachment) => Math.max(max, attachment.sort_order), -1) + 1;

  state.photoAttachments.push({
    id: makeId(),
    pair_id: membership.pair_id,
    experience_id: input.experienceId,
    storage_bucket: "pairview",
    storage_path: `${membership.pair_id}/${input.experienceId}/${makeId()}.png`,
    caption: input.caption,
    sort_order: sortOrder,
    created_by_user_id: userId,
    created_at: now,
    updated_at: now,
    signed_url: signedUrl,
  });

  return { experience_id: input.experienceId } as const;
}

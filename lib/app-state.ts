import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthenticatedUserId } from "@/lib/auth/server";
import type { Json } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildFixtureAppState, getFixtureAuthUserId, isE2EMode } from "@/lib/e2e-fixture";

export type MemberProfile = {
  auth_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type MemberRow = {
  user_id: string;
  role: string;
  created_at: string;
  profile: MemberProfile | null;
};

export type MarkerRow = {
  id: string;
  pair_id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  is_default: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type PhotoAttachmentRow = {
  id: string;
  pair_id: string;
  experience_id: string;
  storage_bucket: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  signed_url: string | null;
};

export type SubjectRow = {
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

export type ExperienceRow = {
  id: string;
  pair_id: string;
  subject_id: string;
  happened_on: string;
  notes: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type ReviewRow = {
  id: string;
  pair_id: string;
  experience_id: string;
  user_id: string;
  score: number;
  body: string | null;
  created_at: string;
  updated_at: string;
};

export type ExperienceCard = ExperienceRow & {
  subject: SubjectRow | null;
  reviews: ReviewRow[];
  markers: MarkerRow[];
  photoAttachments: PhotoAttachmentRow[];
};

export type AppState = {
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
  markers: MarkerRow[];
  experiences: ExperienceCard[];
};

export async function getAppState(): Promise<AppState> {
  if (isE2EMode()) {
    const cookieStore = await cookies();
    const userId = getFixtureAuthUserId(cookieStore);

    if (!userId) {
      redirect("/login");
    }

    return buildFixtureAppState(userId);
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);

  if (!userId) {
    redirect("/login");
  }

  const user = { id: userId };

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
      markers: [],
      experiences: [],
    };
  }

  const [
    pairResult,
    membershipsResult,
    invitationResult,
    experiencesResult,
    subjectsResult,
    reviewsResult,
    experienceMarkersResult,
    markersResult,
    photoAttachmentsResult,
  ] = await Promise.all([
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
    supabase
      .from("experience_markers")
      .select("experience_id, marker_id, pair_id, applied_by_user_id, applied_at")
      .eq("pair_id", membership.pair_id),
    supabase
      .from("markers")
      .select("id, pair_id, name, color, icon, description, is_default, created_by_user_id, created_at, updated_at")
      .eq("pair_id", membership.pair_id),
    supabase
      .from("photo_attachments")
      .select("id, pair_id, experience_id, storage_bucket, storage_path, caption, sort_order, created_by_user_id, created_at, updated_at")
      .eq("pair_id", membership.pair_id)
      .order("sort_order", { ascending: true })
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
  const markerById = new Map(
    (markersResult.data ?? []).map((marker) => [marker.id, marker]),
  );
  const signedPhotoUrls = new Map<string, string | null>();
  const photoAttachments = photoAttachmentsResult.data ?? [];

  if (photoAttachments.length > 0) {
    const signedResults = await Promise.all(
      photoAttachments.map(async (attachment) => {
        const { data, error } = await supabase.storage
          .from(attachment.storage_bucket)
          .createSignedUrl(attachment.storage_path, 60 * 60);

        return [attachment.id, error ? null : data?.signedUrl ?? null] as const;
      }),
    );

    for (const [attachmentId, signedUrl] of signedResults) {
      signedPhotoUrls.set(attachmentId, signedUrl);
    }
  }

  const photoAttachmentsByExperienceId = new Map<string, PhotoAttachmentRow[]>();
  for (const attachment of photoAttachments) {
    const entries = photoAttachmentsByExperienceId.get(attachment.experience_id) ?? [];
    entries.push({
      ...attachment,
      signed_url: signedPhotoUrls.get(attachment.id) ?? null,
    });
    photoAttachmentsByExperienceId.set(attachment.experience_id, entries);
  }

  const reviewsByExperienceId = new Map<string, ReviewRow[]>();
  for (const review of reviewsResult.data ?? []) {
    const entries = reviewsByExperienceId.get(review.experience_id) ?? [];
    entries.push(review);
    reviewsByExperienceId.set(review.experience_id, entries);
  }
  const markersByExperienceId = new Map<string, MarkerRow[]>();
  for (const entry of experienceMarkersResult.data ?? []) {
    const marker = markerById.get(entry.marker_id);
    if (!marker) continue;
    const entries = markersByExperienceId.get(entry.experience_id) ?? [];
    entries.push(marker);
    markersByExperienceId.set(entry.experience_id, entries);
  }

  const experiences: ExperienceCard[] = (experiencesResult.data ?? []).map(
    (experience) => ({
      ...experience,
      subject: subjectById.get(experience.subject_id) ?? null,
      reviews: reviewsByExperienceId.get(experience.id) ?? [],
      markers: markersByExperienceId.get(experience.id) ?? [],
      photoAttachments: photoAttachmentsByExperienceId.get(experience.id) ?? [],
    }),
  );

  return {
    user,
    membership,
    pair: pairResult.data ?? null,
    members,
    invitation: invitationResult.data ?? null,
    markers: markersResult.data ?? [],
    experiences,
  };
}

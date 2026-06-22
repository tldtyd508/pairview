import { type NextRequest } from "next/server";
import {
  fixtureUpsertReview,
  getFixtureAuthUserId,
  isE2EMode,
} from "@/lib/e2e-fixture";
import { getAuthenticatedUserId } from "@/lib/auth/server";
import { redirectAfterPost } from "@/lib/http/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const experienceId = normalizeText(formData.get("experience_id"));
  const scoreValue = normalizeText(formData.get("score"));
  const body = normalizeText(formData.get("body"));

  if (!experienceId || !scoreValue) {
    return redirectAfterPost(new URL("/app?error=missing-review-fields", request.url));
  }

  const score = Number(scoreValue);

  if (!Number.isFinite(score) || score < 0 || score > 5) {
    return redirectAfterPost(new URL("/app?error=invalid-score", request.url));
  }

  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return redirectAfterPost(new URL("/login", request.url));
    }

    const result = fixtureUpsertReview(userId, {
      experienceId,
      score,
      body,
    });

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return redirectAfterPost(
        new URL(`/app?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return redirectAfterPost(
      new URL(`/app?reviewed=1&experience=${result.experience_id}`, request.url),
    );
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);

  if (!userId) {
    return redirectAfterPost(new URL("/login", request.url));
  }

  const { data: experience, error: experienceError } = await supabase
    .from("experiences")
    .select("id, pair_id")
    .eq("id", experienceId)
    .maybeSingle();

  if (experienceError || !experience) {
    return redirectAfterPost(new URL("/app?error=experience-not-found", request.url));
  }

  const { data: membership } = await supabase
    .from("pair_memberships")
    .select("pair_id")
    .eq("user_id", userId)
    .eq("pair_id", experience.pair_id)
    .maybeSingle();

  if (!membership) {
    return redirectAfterPost(new URL("/app?error=forbidden-review", request.url));
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      pair_id: experience.pair_id,
      experience_id: experience.id,
      user_id: userId,
      score,
      body,
    },
    { onConflict: "experience_id,user_id" },
  );

  if (error) {
    return redirectAfterPost(
      new URL(`/app?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return redirectAfterPost(
    new URL(`/app?reviewed=1&experience=${experience.id}`, request.url),
  );
}

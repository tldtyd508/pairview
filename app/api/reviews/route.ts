import { NextResponse, type NextRequest } from "next/server";
import {
  fixtureUpsertReview,
  getFixtureAuthUserId,
  isE2EMode,
} from "@/lib/e2e-fixture";
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
    return NextResponse.redirect(new URL("/app?error=missing-review-fields", request.url));
  }

  const score = Number(scoreValue);

  if (!Number.isFinite(score) || score < 0 || score > 5) {
    return NextResponse.redirect(new URL("/app?error=invalid-score", request.url));
  }

  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const result = fixtureUpsertReview(userId, {
      experienceId,
      score,
      body,
    });

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return NextResponse.redirect(
        new URL(`/app?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return NextResponse.redirect(
      new URL(`/app?reviewed=1&experience=${result.experience_id}`, request.url),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: experience, error: experienceError } = await supabase
    .from("experiences")
    .select("id, pair_id")
    .eq("id", experienceId)
    .maybeSingle();

  if (experienceError || !experience) {
    return NextResponse.redirect(new URL("/app?error=experience-not-found", request.url));
  }

  const { data: membership } = await supabase
    .from("pair_memberships")
    .select("pair_id")
    .eq("user_id", authData.user.id)
    .eq("pair_id", experience.pair_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.redirect(new URL("/app?error=forbidden-review", request.url));
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      pair_id: experience.pair_id,
      experience_id: experience.id,
      user_id: authData.user.id,
      score,
      body,
    },
    { onConflict: "experience_id,user_id" },
  );

  if (error) {
    return NextResponse.redirect(
      new URL(`/app?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(`/app?reviewed=1&experience=${experience.id}`, request.url),
  );
}

import { NextResponse, type NextRequest } from "next/server";
import {
  fixtureAttachMarker,
  fixtureDetachMarker,
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
  const markerId = normalizeText(formData.get("marker_id"));
  const intent = normalizeText(formData.get("intent")) ?? "attach";

  if (!experienceId || !markerId) {
    return NextResponse.redirect(new URL("/app?error=missing-marker-fields", request.url));
  }

  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const result =
      intent === "detach"
        ? fixtureDetachMarker(userId, { experienceId, markerId })
        : fixtureAttachMarker(userId, { experienceId, markerId });

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return NextResponse.redirect(
        new URL(`/history/${experienceId}?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return NextResponse.redirect(
      new URL(
        `/history/${experienceId}?${intent === "detach" ? "marker_removed" : "marker_applied"}=1`,
        request.url,
      ),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: experience } = await supabase
    .from("experiences")
    .select("id, pair_id")
    .eq("id", experienceId)
    .maybeSingle();

  if (!experience) {
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

  if (intent === "detach") {
    const { error } = await supabase
      .from("experience_markers")
      .delete()
      .eq("experience_id", experience.id)
      .eq("marker_id", markerId);

    if (error) {
      return NextResponse.redirect(
        new URL(`/history/${experience.id}?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }

    return NextResponse.redirect(new URL(`/history/${experience.id}?marker_removed=1`, request.url));
  }

  const { data: marker } = await supabase
    .from("markers")
    .select("id, pair_id")
    .eq("id", markerId)
    .maybeSingle();

  if (!marker || marker.pair_id !== experience.pair_id) {
    return NextResponse.redirect(new URL("/app?error=experience-not-found", request.url));
  }

  const { error } = await supabase.from("experience_markers").upsert(
    {
      experience_id: experience.id,
      marker_id: marker.id,
      pair_id: experience.pair_id,
      applied_by_user_id: authData.user.id,
    },
    { onConflict: "experience_id,marker_id" },
  );

  if (error) {
    return NextResponse.redirect(
      new URL(`/history/${experience.id}?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL(`/history/${experience.id}?marker_applied=1`, request.url));
}

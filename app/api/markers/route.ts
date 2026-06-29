import { type NextRequest } from "next/server";
import {
  fixtureCreateMarker,
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
  const name = normalizeText(formData.get("name"));
  const icon = normalizeText(formData.get("icon"));
  const color = normalizeText(formData.get("color"));
  const description = normalizeText(formData.get("description"));

  if (!name || !icon || !color) {
    return redirectAfterPost(new URL("/evaluate?error=missing-marker-fields", request.url));
  }

  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return redirectAfterPost(new URL("/login", request.url));
    }

    const result = fixtureCreateMarker(userId, {
      name,
      icon,
      color,
      description,
    });

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return redirectAfterPost(
        new URL(`/evaluate?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return redirectAfterPost(new URL("/evaluate?marker_created=1", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);

  if (!userId) {
    return redirectAfterPost(new URL("/login", request.url));
  }

  const { data: membership } = await supabase
    .from("pair_memberships")
    .select("pair_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return redirectAfterPost(new URL("/app?error=authentication_required", request.url));
  }

  const { error } = await supabase.from("markers").insert({
    pair_id: membership.pair_id,
    name,
    icon,
    color,
    description,
    created_by_user_id: userId,
  });

  if (error) {
    return redirectAfterPost(
      new URL(`/evaluate?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return redirectAfterPost(new URL("/evaluate?marker_created=1", request.url));
}

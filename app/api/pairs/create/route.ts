import { type NextRequest } from "next/server";
import {
  fixtureCreatePair,
  getFixtureAuthUserId,
  isE2EMode,
} from "@/lib/e2e-fixture";
import { getAuthenticatedUserId } from "@/lib/auth/server";
import { redirectAfterPost } from "@/lib/http/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const label = String(formData.get("label") ?? "").trim() || null;

  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return redirectAfterPost(new URL("/login", request.url));
    }

    const result = fixtureCreatePair(userId, label);

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return redirectAfterPost(
        new URL(`/app?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return redirectAfterPost(new URL("/app?created=1", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);

  if (!userId) {
    return redirectAfterPost(new URL("/login", request.url));
  }

  const { error } = await supabase.rpc("create_pair_with_invitation", {
    pair_label: label,
  });

  if (error) {
    return redirectAfterPost(
      new URL(`/app?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return redirectAfterPost(new URL("/app?created=1", request.url));
}

import { NextResponse, type NextRequest } from "next/server";
import {
  fixtureCreatePair,
  getFixtureAuthUserId,
  isE2EMode,
} from "@/lib/e2e-fixture";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const label = String(formData.get("label") ?? "").trim() || null;

  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const result = fixtureCreatePair(userId, label);

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return NextResponse.redirect(
        new URL(`/app?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return NextResponse.redirect(new URL("/app?created=1", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { error } = await supabase.rpc("create_pair_with_invitation", {
    pair_label: label,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/app?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL("/app?created=1", request.url));
}

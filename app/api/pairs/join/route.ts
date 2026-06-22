import { NextResponse, type NextRequest } from "next/server";
import {
  fixtureJoinPair,
  getFixtureAuthUserId,
  isE2EMode,
} from "@/lib/e2e-fixture";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  if (!code) {
    return NextResponse.redirect(new URL("/app?error=missing-code", request.url));
  }

  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const result = fixtureJoinPair(userId, code);

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return NextResponse.redirect(
        new URL(`/app?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return NextResponse.redirect(new URL("/app?joined=1", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { error } = await supabase.rpc("join_pair_via_invitation", {
    invitation_code: code,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/app?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL("/app?joined=1", request.url));
}

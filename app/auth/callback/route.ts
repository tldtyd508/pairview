import { NextResponse, type NextRequest } from "next/server";
import { syncUserProfile } from "@/lib/auth/sync-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing-code", request.url));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=callback", request.url),
      );
    }

    await syncUserProfile(supabase);

    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=callback", request.url));
  }
}

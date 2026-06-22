import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/redirect";

async function syncUserProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  const user = authData.user;

  if (!user) {
    throw new Error("No authenticated user after callback");
  }

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    null;
  const avatarUrl = user.user_metadata?.avatar_url ?? null;

  const { error: profileError } = await supabase.from("users").upsert({
    auth_user_id: user.id,
    display_name: displayName,
    avatar_url: avatarUrl,
  }, { onConflict: "auth_user_id" });

  if (profileError) {
    throw profileError;
  }
}

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

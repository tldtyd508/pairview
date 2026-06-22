import { NextResponse, type NextRequest } from "next/server";
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
    return NextResponse.redirect(new URL("/app?error=missing-marker-fields", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: membership } = await supabase
    .from("pair_memberships")
    .select("pair_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.redirect(new URL("/app?error=authentication_required", request.url));
  }

  const { error } = await supabase.from("markers").insert({
    pair_id: membership.pair_id,
    name,
    icon,
    color,
    description,
    created_by_user_id: authData.user.id,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/app?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL("/app?marker_created=1", request.url));
}

import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  fixtureUploadPhoto,
  getFixtureAuthUserId,
  isE2EMode,
} from "@/lib/e2e-fixture";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const maxFileSizeBytes = 10 * 1024 * 1024;

function normalizeText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const experienceId = normalizeText(formData.get("experience_id"));
  const caption = normalizeText(formData.get("caption"));
  const file = formData.get("photo");

  if (!experienceId || !(file instanceof File)) {
    return NextResponse.redirect(new URL("/app?error=missing-photo-fields", request.url));
  }

  const extension = allowedMimeTypes.get(file.type);

  if (!extension) {
    return NextResponse.redirect(new URL("/app?error=invalid-photo-type", request.url));
  }

  if (file.size > maxFileSizeBytes) {
    return NextResponse.redirect(new URL("/app?error=photo-too-large", request.url));
  }

  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const result = await fixtureUploadPhoto(userId, {
      experienceId,
      file,
      caption,
    });

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return NextResponse.redirect(
        new URL(`/history/${experienceId}?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return NextResponse.redirect(new URL(`/history/${experienceId}?photo_uploaded=1`, request.url));
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
    return NextResponse.redirect(
      new URL(`/history/${experienceId}?error=experience-not-found`, request.url),
    );
  }

  const { data: membership } = await supabase
    .from("pair_memberships")
    .select("pair_id")
    .eq("user_id", authData.user.id)
    .eq("pair_id", experience.pair_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.redirect(new URL(`/history/${experienceId}?error=forbidden-review`, request.url));
  }

  const path = `${experience.pair_id}/${experience.id}/${randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("pairview")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.redirect(
      new URL(`/history/${experience.id}?error=${encodeURIComponent(uploadError.message)}`, request.url),
    );
  }

  const { data: latestAttachment } = await supabase
    .from("photo_attachments")
    .select("sort_order")
    .eq("experience_id", experience.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("photo_attachments").insert({
    pair_id: experience.pair_id,
    experience_id: experience.id,
    storage_bucket: "pairview",
    storage_path: path,
    caption,
    sort_order: (latestAttachment?.sort_order ?? -1) + 1,
    created_by_user_id: authData.user.id,
  });

  if (insertError) {
    return NextResponse.redirect(
      new URL(`/history/${experience.id}?error=${encodeURIComponent(insertError.message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL(`/history/${experience.id}?photo_uploaded=1`, request.url));
}

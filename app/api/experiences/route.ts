import { NextResponse, type NextRequest } from "next/server";
import {
  fixtureCreateExperience,
  getFixtureAuthUserId,
  isE2EMode,
} from "@/lib/e2e-fixture";
import { getAuthenticatedUserId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  if (isE2EMode()) {
    const userId = getFixtureAuthUserId(request.cookies);

    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const restaurantName = normalizeText(formData.get("restaurant_name"));
    const location = normalizeText(formData.get("location"));
    const category = normalizeText(formData.get("category"));
    const orderedMenus = normalizeText(formData.get("ordered_menus"));
    const visitDate = normalizeText(formData.get("visit_date"));
    const notes = normalizeText(formData.get("notes"));

    if (!restaurantName || !location || !category || !orderedMenus || !visitDate) {
      return NextResponse.redirect(
        new URL("/app?error=missing-restaurant-fields", request.url),
      );
    }

    const result = fixtureCreateExperience(userId, {
      restaurantName,
      location,
      category,
      orderedMenus,
      visitDate,
      notes,
    });

    if ("error" in result) {
      const errorMessage = result.error ?? "unknown_error";
      return NextResponse.redirect(
        new URL(`/app?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    return NextResponse.redirect(
      new URL(`/app?experience=${result.experience_id}&created=1`, request.url),
    );
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: membership } = await supabase
    .from("pair_memberships")
    .select("pair_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.redirect(new URL("/app?error=authentication_required", request.url));
  }

  const restaurantName = normalizeText(formData.get("restaurant_name"));
  const location = normalizeText(formData.get("location"));
  const category = normalizeText(formData.get("category"));
  const orderedMenus = normalizeText(formData.get("ordered_menus"));
  const visitDate = normalizeText(formData.get("visit_date"));
  const notes = normalizeText(formData.get("notes"));

  if (!restaurantName || !location || !category || !orderedMenus || !visitDate) {
    return NextResponse.redirect(
      new URL("/app?error=missing-restaurant-fields", request.url),
    );
  }

  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .insert({
      pair_id: membership.pair_id,
      kind: "restaurant",
      title: restaurantName,
      description: location,
      metadata: {
        location,
        category,
        ordered_menus: orderedMenus,
        record_mode: "first_visit_only",
      },
      created_by_user_id: userId,
    })
    .select("id")
    .single();

  if (subjectError) {
    return NextResponse.redirect(
      new URL(`/app?error=${encodeURIComponent(subjectError.message)}`, request.url),
    );
  }

  const { data: experience, error: experienceError } = await supabase
    .from("experiences")
    .insert({
      pair_id: membership.pair_id,
      subject_id: subject.id,
      happened_on: visitDate,
      notes,
      created_by_user_id: userId,
    })
    .select("id")
    .single();

  if (experienceError) {
    return NextResponse.redirect(
      new URL(`/app?error=${encodeURIComponent(experienceError.message)}`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(`/app?experience=${experience.id}&created=1`, request.url),
  );
}

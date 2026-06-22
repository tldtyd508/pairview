import { NextResponse } from "next/server";
import { syncUserProfile } from "@/lib/auth/sync-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await syncUserProfile(supabase);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "profile_sync_failed" }, { status: 401 });
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function getAuthenticatedUserId(supabase: SupabaseClient<Database>) {
  try {
    const { data, error } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!error && typeof userId === "string" && userId) {
      return userId;
    }
  } catch {
    // Fall back to claims below.
  }

  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;

  if (error || typeof subject !== "string" || !subject) return null;
  return subject;
}

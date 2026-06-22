import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function syncUserProfile(supabase: SupabaseClient<Database>) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

  const user = authData.user;
  if (!user) throw new Error("No authenticated user");

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    null;
  const avatarUrl = user.user_metadata?.avatar_url ?? null;

  const { error: profileError } = await supabase.from("users").upsert(
    {
      auth_user_id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
    { onConflict: "auth_user_id" },
  );

  if (profileError) throw profileError;

  return user;
}

import { NextResponse, type NextRequest } from "next/server";
import { syncUserProfile } from "@/lib/auth/sync-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  token?: string;
  nonce?: string;
};

export async function POST(request: NextRequest) {
  let body: Body = {};

  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!body.token || !body.nonce) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: body.token,
      nonce: body.nonce,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    await syncUserProfile(supabase);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "authentication_failed" }, { status: 401 });
  }
}

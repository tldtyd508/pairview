import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { site } from "@/lib/site-data";

type SearchParams = {
  created?: string;
  joined?: string;
  error?: string;
};

type AppPageProps = {
  searchParams?: Promise<SearchParams>;
};

const errorMessages: Record<string, string> = {
  authentication_required: "로그인이 필요하다.",
  user_already_in_pair: "이미 다른 pair에 속해 있다.",
  invalid_invitation: "초대 코드가 유효하지 않다.",
  invitation_already_used: "이미 사용된 초대 코드다.",
  invitation_expired: "초대 코드가 만료됐다.",
  self_invitation_not_allowed: "자기 자신이 만든 초대에는 참여할 수 없다.",
  pair_is_full: "이 pair는 이미 2명으로 가득 찼다.",
  "missing-code": "초대 코드를 입력해라.",
};

async function getAppState() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const user = authData.user;
  const { data: membership } = await supabase
    .from("pair_memberships")
    .select("pair_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { user, membership: null, pair: null, members: [], invitation: null };
  }

  const [{ data: pair }, { data: memberships }, { data: invitation }] =
    await Promise.all([
      supabase.from("pairs").select("id, label, created_at").eq("id", membership.pair_id).maybeSingle(),
      supabase
        .from("pair_memberships")
        .select("user_id, role, created_at")
        .eq("pair_id", membership.pair_id)
        .order("created_at", { ascending: true }),
      supabase
        .from("invitations")
        .select("code, created_at, uses_remaining, accepted_at, revoked_at, expires_at, created_by_user_id")
        .eq("pair_id", membership.pair_id)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("uses_remaining", 0)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const memberIds = (memberships ?? []).map((row) => row.user_id);
  const { data: profiles } = memberIds.length
    ? await supabase
        .from("users")
        .select("auth_user_id, display_name, avatar_url")
        .in("auth_user_id", memberIds)
    : { data: [] };

  const profileByAuthId = new Map(
    (profiles ?? []).map((profile) => [profile.auth_user_id, profile]),
  );

  const members = (memberships ?? []).map((row) => ({
    ...row,
    profile: profileByAuthId.get(row.user_id) ?? null,
  }));

  return {
    user,
    membership,
    pair: pair ?? null,
    members,
    invitation: invitation ?? null,
  };
}

export default async function AppHome({
  searchParams,
}: AppPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const state = await getAppState();

  const message =
    params?.error ? errorMessages[params.error] ?? params.error : params?.created === "1"
      ? "pair가 생성됐다. 초대 코드를 전달해라."
      : params?.joined === "1"
        ? "초대 코드로 pair에 합류했다."
        : null;

  if (!state.membership) {
    return (
      <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
        <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center">
          <div className="w-full rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
              Pair setup
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {site.name} onboarding
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--page-muted)] sm:text-lg">
              로그인은 끝났고, 이제 pair를 만든다. 여기서 생성한 초대 코드를
              상대에게 보내면 된다.
            </p>

            {message ? (
              <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
                {message}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <form
                action="/api/pairs/create"
                method="post"
                className="rounded-2xl border border-[var(--page-border)] bg-white/70 p-5"
              >
                <p className="text-sm font-semibold">Create a pair</p>
                <label className="mt-4 block text-sm text-[var(--page-muted)]">
                  Pair label
                  <input
                    name="label"
                    placeholder="예: 우리 커플"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-5 rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white"
                >
                  Pair 만들기
                </button>
              </form>

              <form
                action="/api/pairs/join"
                method="post"
                className="rounded-2xl border border-[var(--page-border)] bg-white/70 p-5"
              >
                <p className="text-sm font-semibold">Join with code</p>
                <label className="mt-4 block text-sm text-[var(--page-muted)]">
                  Invitation code
                  <input
                    name="code"
                    placeholder="AB12CD34"
                    className="mt-2 w-full rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3 text-sm uppercase outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-5 rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
                >
                  Join pair
                </button>
              </form>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/logout"
                className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Sign out
              </Link>
              <Link
                href="/"
                className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
              >
                Public landing
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const pairLabel = state.pair?.label ?? "Unlabeled pair";
  const activeInvite = state.invitation?.code ?? null;
  const pendingInviteState = activeInvite ? "Pending invite active" : "No active invite";

  return (
    <main className="min-h-screen px-5 py-6 text-[var(--page-text)] sm:px-8 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center">
        <div className="w-full rounded-[2rem] border border-[var(--page-border)] bg-[var(--page-surface)] p-6 shadow-[0_20px_80px_rgba(48,33,18,0.09)] backdrop-blur-md sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--page-muted)]">
            Private workspace
          </p>
          <h1
            className="mt-4 text-4xl font-semibold tracking-[-0.08em] sm:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {pairLabel}
          </h1>

          {message ? (
            <div className="mt-6 rounded-2xl border border-[var(--page-border)] bg-white/70 px-4 py-3 text-sm text-[var(--page-muted)]">
              {message}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[var(--page-border)] bg-white/70 p-5">
              <p className="text-sm font-semibold">Pair members</p>
              <div className="mt-4 grid gap-3">
                {state.members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--page-border)] bg-white px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {member.profile?.display_name ?? "Unnamed user"}
                      </div>
                      <div className="text-xs text-[var(--page-muted)]">
                        {member.role}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--page-muted)]">
                      {member.user_id === state.user.id ? "You" : "Partner"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 text-sm text-[var(--page-muted)]">
                Current member count: {state.members.length}/2
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--page-border)] bg-[rgba(31,26,22,0.96)] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                Invitation state
              </p>
              <div className="mt-4 text-lg font-medium">{pendingInviteState}</div>
              {activeInvite ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/55">
                    Invite code
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-[0.18em]">
                    {activeInvite}
                  </div>
                  <div className="mt-2 text-sm text-white/70">
                    Share this once. It becomes invalid after use.
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/70">
                  초대가 끝났거나 아직 생성되지 않았다.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/logout"
              className="rounded-full bg-[var(--page-accent)] px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              Sign out
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[var(--page-border)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--page-text)]"
            >
              Public landing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

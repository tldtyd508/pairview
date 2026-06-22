import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = "/Users/jhg/vercelebesel/pairview";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("supabase migration models the pair domain", () => {
  const migration = read("supabase/migrations/0001_initial_schema.sql");

  for (const tableName of [
    "public.users",
    "public.pairs",
    "public.pair_memberships",
    "public.invitations",
    "public.subjects",
    "public.experiences",
    "public.reviews",
    "public.markers",
    "public.experience_markers",
    "public.photo_attachments",
  ]) {
    assert.match(migration, new RegExp(`create table if not exists ${tableName}`));
  }

  assert.match(migration, /create or replace function public\.is_pair_member/);
  assert.match(migration, /alter table public\.subjects enable row level security/);
  assert.match(migration, /create policy "pair members can manage reviews"/);
  assert.match(migration, /unique \(user_id\)/);
  assert.match(migration, /public\.subjects[\s\S]*public\.experiences/);
});

test("supabase client helpers are present", () => {
  const browserClient = read("lib/supabase/client.ts");
  const serverClient = read("lib/supabase/server.ts");

  assert.match(browserClient, /createBrowserClient/);
  assert.match(serverClient, /createServerClient/);
  assert.match(serverClient, /cookies\(\)/);
});

test("schema docs and verification SQL exist", () => {
  const readme = read("supabase/README.md");
  const verification = read("supabase/tests/cross_pair_denial.sql");

  assert.match(readme, /users/);
  assert.match(readme, /subjects/);
  assert.match(readme, /Cross-pair access is denied/);
  assert.match(verification, /Pair B member/);
  assert.match(verification, /denied_subjects_for_pair_a/);
});

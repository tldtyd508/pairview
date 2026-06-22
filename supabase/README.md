# Supabase setup

Pairview uses Supabase for authentication, storage, and the Postgres data model.

## What this schema contains

| Table | Purpose |
| --- | --- |
| `users` | App profile for a signed-in auth user |
| `pairs` | A private couple workspace |
| `pair_memberships` | Exactly which users belong to which pair |
| `invitations` | Single-use join links or codes |
| `subjects` | The reusable thing being reviewed, such as a restaurant |
| `experiences` | One visit, viewing, or other occurrence of that subject |
| `reviews` | One partner's score and short review for one experience |
| `markers` | Pair-specific labels such as `셀카` |
| `experience_markers` | Which markers were attached to which experience |
| `photo_attachments` | Optional images stored for an experience |

The schema keeps `subjects` separate from `experiences` so we can decide later whether repeat visits update an existing subject or create a new experience row.

## Manual setup

1. Create a Supabase project.
2. Add Google as an auth provider in Supabase Auth.
3. Run `supabase/migrations/0001_initial_schema.sql` in the SQL editor.
4. Copy the project URL and anon key into `.env.local`.
5. Set the redirect URL to the Vercel deployment and any local callback routes used later.

### Google auth provider

- Enable Google in Supabase Auth providers.
- Add these redirect URLs:
  - `https://pairview.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
- Make sure the Vercel deployment URL also matches whatever `NEXT_PUBLIC_SITE_URL` points to in production.

## RLS notes

Every pair-owned table uses row-level security and the shared `public.is_pair_member(pair_uuid)` helper function.

That means a user can only see or mutate rows for a pair they belong to. Cross-pair access is denied in the database, not just hidden in the UI.

Pairmate profile visibility is also handled in the database so the onboarding workspace can show both members without exposing unrelated users.

## Verification

Use `supabase/tests/cross_pair_denial.sql` as the manual policy check template.

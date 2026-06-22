# Pairview MVP execution plan

This plan is intentionally split into small, independently verifiable tasks. Run one numbered task per Codex thread. Do not start a later task while an earlier task has failing checks.

## Execution prompt format

For each task, give the agent:

- **Goal:** the numbered task and expected outcome.
- **Context:** `AGENTS.md`, `docs/PRODUCT.md`, this plan, and the affected files.
- **Constraints:** no unrelated work; preserve open decisions; no Vercel CLI.
- **Done when:** the task's acceptance criteria and validation commands pass.

## 1. Replace the placeholder with the application shell

### Scope

- Scaffold a Next.js App Router project with TypeScript and Tailwind CSS in the existing repository.
- Preserve the Pairview name, tagline, and current coming-soon visual direction.
- Add a mobile-first shell, base typography, metadata, robots, sitemap, and Vercel Web Analytics.
- Add scripts for lint, type-check, test, and production build.
- Add `.env.example` without credentials.

### Acceptance criteria

- The home page renders without authentication.
- Metadata uses the Pairview name and tagline.
- `npm run lint`, type-check, tests, and `npm run build` pass.
- The temporary standalone `index.html` is removed after the Next.js page replaces it.

## 2. Establish Supabase and the database schema

### Scope

- Add Supabase browser and server clients using environment variables.
- Add versioned SQL migrations for the initial domain model.
- Model users, pairs, pair memberships, invitations, subjects, experiences, reviews, markers, experience markers, and photo attachments.
- Keep `subjects.kind` extensible while supporting only `restaurant` in the MVP UI.
- Keep `subjects` separate from `experiences` so the repeat-visit decision can be made later without replacing the core schema.
- Add row-level security policies that isolate every pair.
- Document manual Supabase project setup and migration steps.

### Acceptance criteria

- A schema diagram or table summary is documented.
- Every pair-owned table has explicit RLS policies.
- Unauthorized users cannot read or mutate pair-owned records.
- Generated database types are available to application code.
- Database tests or policy verification SQL cover cross-pair denial.

## 3. Implement Google authentication

### Scope

- Add Google sign-in, callback handling, sign-out, and protected-route behavior.
- Create or synchronize the application's user profile after authentication.
- Show clear loading and authentication error states.
- Document Google provider and redirect URL setup required in Supabase.

### Acceptance criteria

- An unauthenticated user can view the landing page but cannot access the app area.
- A signed-in user reaches onboarding or their pair workspace.
- Sign-out clears the session and returns to the public page.
- Auth routes have automated coverage where practical.

## 4. Implement pair onboarding and invitations

### Scope

- Let a user create a pair or join one using a single-use invitation link/code.
- Restrict membership to two active users for the MVP.
- Handle expired, invalid, reused, and self-created invitations.
- Show pair members and the pending invitation state.

### Acceptance criteria

- Two Google-authenticated users can form one pair.
- A user cannot join multiple pairs in the MVP.
- A third user cannot join a full pair.
- Invitation mutations are protected server-side and transactionally safe.

## 5. Build restaurant entry and independent reviews

### Decision gate

Before implementing submission behavior, confirm open decision 1 in `docs/PRODUCT.md`. If it remains unresolved, implement first visits only and do not invent repeat-visit behavior.

### Scope

- Add a restaurant form for name, location, visit date, category, and ordered menus.
- Allow each member to save or update only their own 0–5 score and one-line review.
- Display both reviews side by side without averaging them.
- Support a state where only one partner has reviewed.

### Acceptance criteria

- Both members can review the same shared experience independently.
- One member cannot edit the other member's review.
- Validation is enforced on both client and server.
- Empty, partial, complete, and error states are covered.

## 6. Build history, search, sorting, and filters

### Scope

- Add a mobile-first history list and detail page.
- Search restaurant name, location, category, and menu text.
- Sort by recent visit and either partner's score.
- Filter by date, category, score range, review completion, and marker.
- Keep filter state in the URL where practical.

### Acceptance criteria

- Records belonging to the pair are searchable and recoverable on refresh.
- No average score appears.
- Empty results explain how to clear filters or add a record.
- Query behavior has automated tests.

## 7. Add couple markers and optional photos

### Decision gate

Confirm whether configurable recommendation conditions belong in the MVP. Manual marker application does not depend on that decision.

### Scope

- Let a pair define marker name, color, and icon.
- Let members apply or remove a marker from an experience.
- Support an optional photo stored in a private Supabase Storage bucket.
- For the initial pair, allow a `셀카` marker and photo without hard-coding it globally.
- If approved, recommend a marker when its configured score condition is satisfied; never auto-apply it.

### Acceptance criteria

- Marker identity is visually clear in list and detail views.
- Photo access is authorized to the owning pair through short-lived URLs or an equivalent private mechanism.
- Invalid file type and size errors are handled.
- Cross-pair photo access is denied.

## 8. Harden the MVP and prepare release

### Scope

- Add meaningful loading, empty, error, offline, and not-found states.
- Review accessibility, responsive layout, metadata, Open Graph, sitemap, robots, and Analytics.
- Add a minimal end-to-end happy-path test covering sign-in boundaries, pair creation, entry creation, two reviews, marker, and history lookup.
- Review RLS and storage policies independently from UI behavior.
- Update README with local setup, environment variables, checks, architecture, and manual Vercel/Supabase steps.

### Acceptance criteria

- Lint, type-check, unit/integration tests, end-to-end tests, and production build pass.
- No secret is tracked by Git.
- The MVP success criterion in `docs/PRODUCT.md` is demonstrably met.
- The repository can deploy from GitHub through the existing Vercel project without Vercel CLI use.

## Deferred beyond MVP

- Public sharing or public profiles.
- More than two members per group.
- Categories beyond restaurants in the UI.
- Recommendation feeds or partner taste comparison analytics.
- Native mobile applications.
- Importing restaurant data from external APIs.

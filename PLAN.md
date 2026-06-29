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

## Post-MVP dashboard tickets

These tickets assume MVP tasks 1–8 are complete and the current app already has:

- `/app` as the authenticated evaluation workspace.
- `/history` as the full archive with filters.
- `/history/[experienceId]` as the detail page.
- Shared record cards in `app/_components/experience-cards.tsx`.

Work one ticket at a time. Keep each ticket independently reviewable.

## 9. Add best-record sorting to history

### Goal

Let users view the archive by "best" records without showing an average score as a product concept.

### Scope

- Add `best` to the history sort options.
- Sort best records by the sum of the two partners' scores in descending order.
- Include only records with both partner reviews when sorting by `best`.
- Break ties by most recent visit date.
- Keep the visible card display as separate scores, e.g. `You 4.5` and `Partner 5`, not an average.
- Support `/history?sort=best` directly through URL state.
- Update `lib/history.ts` and `lib/history.js` together.

### Acceptance criteria

- `/history?sort=best` shows only records reviewed by both members.
- Best records are ordered by combined score, then recent visit.
- Other sort modes keep their current behavior.
- Automated history tests cover the `best` filter and tie-break behavior.

### Validation

```bash
npm test
npm run typecheck
```

## 10. Move the evaluation workspace from `/app` to `/evaluate`

### Goal

Free `/app` to become the dashboard while preserving the current record-entry and review workflow.

### Scope

- Create `/evaluate` and move the current authenticated evaluation UI there.
- Keep pair onboarding available for users without a pair. Either:
  - keep onboarding in `/app` until dashboard can handle it, or
  - extract onboarding into a reusable component and render it from both routes as needed.
- Update post-submit redirects that should return to the evaluation workflow:
  - restaurant creation
  - review save
  - marker creation if it remains on the evaluation page
- Leave `/history` and `/history/[experienceId]` intact.
- Add a temporary redirect or link path from `/app` only if needed during this transition.

### Acceptance criteria

- Signed-in users with a pair can open `/evaluate` and perform the current record/review workflow.
- Restaurant creation redirects back to `/evaluate?created=1&experience=...`.
- Review save redirects back to `/evaluate?reviewed=1&experience=...`.
- Existing E2E happy path passes after path updates.
- No route exposes pair data to unauthenticated users.

### Validation

```bash
npm test
npm run typecheck
npm run lint
npm run test:e2e
```

## 11. Build `/app` as the dashboard

### Goal

Make `/app` the authenticated home that helps the pair revisit recent records, best records, and pending reviews.

### Scope

- Replace the evaluation-heavy `/app` content with a dashboard.
- Keep onboarding behavior for signed-in users without a pair.
- Add a shared authenticated navigation component with:
  - `대시보드` → `/app`
  - `평가 남기기` → `/evaluate`
  - `기록 보관함` → `/history`
- Add summary cards:
  - total record count
  - records pending my review
  - records reviewed by both members
  - records with at least one marker
- Add a "최근 기록" section:
  - show the 3–5 most recent records
  - link to `/history?sort=recent`
  - each item links to its detail page
- Add a "베스트 기록" section:
  - show the top 3–5 records using the same best-ranking logic from ticket 9
  - link to `/history?sort=best`
  - show separate partner scores, not an average
- Add a "평가 대기" section:
  - show up to 3 records missing the current user's review
  - link to `/evaluate`
- Keep the layout mobile-first and minimal.

### Acceptance criteria

- `/app` is useful without scrolling through a large form first.
- Recent records, best records, and pending reviews are all accessible from the dashboard.
- Dashboard record links open `/history/[experienceId]`.
- Empty states explain what to do next:
  - no records yet → go to `/evaluate`
  - no best records yet → both members need to review records
  - no pending reviews → no action needed
- No average score is shown.

### Validation

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## 12. Update E2E coverage for dashboard navigation

### Goal

Protect the new route split and dashboard entry points from regression.

### Scope

- Update `tests/e2e/pairview-happy-path.spec.ts` to use:
  - `/app` for dashboard
  - `/evaluate` for creating and reviewing records
  - `/history` for archive browsing
- Add assertions that dashboard shows:
  - a recent record after one is created
  - a pending review for the partner before they review
  - a best record after both reviews exist
- Keep the fixture-only E2E mode; do not depend on real OAuth or production Supabase.

### Acceptance criteria

- The happy path still covers sign-in boundary, pair creation, pair join, restaurant creation, two reviews, marker, photo, history detail.
- The test explicitly proves `/app` is dashboard, not the evaluation form.
- E2E remains deterministic and isolated.

### Validation

```bash
npm run test:e2e
npm run build
```

## 13. Polish dashboard copy and visual hierarchy

### Goal

Make the dashboard feel like PairView's home rather than an admin stats screen.

### Scope

- Prefer record-oriented labels over analytics-heavy labels.
- Suggested section names:
  - `최근 기록`
  - `베스트 기록`
  - `평가 대기`
  - `빠른 이동`
- Use count cards as supporting context, not the main content.
- Ensure CTA labels are action-oriented:
  - `새 기록 남기기`
  - `평가하러 가기`
  - `전체 기록 보기`
- Keep Korean user-facing copy consistent with the existing direct tone.

### Acceptance criteria

- The page's primary visual weight is on records, not numbers.
- The dashboard works on mobile without dense tables.
- All new copy is in Korean unless it is a small technical label already established elsewhere.

### Validation

```bash
npm run lint
npm run build
```

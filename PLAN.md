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

## 14. Replace implementation-note copy with user-facing help

### Goal

Remove or rewrite UI copy that sounds like internal planning notes, implementation comments, or developer instructions.

### Scope

- Review user-facing strings in:
  - `app/page.tsx`
  - `app/login/page.tsx`
  - `app/app/page.tsx`
  - `app/evaluate/page.tsx`
  - `app/history/page.tsx`
  - `app/history/[experienceId]/page.tsx`
  - shared components under `app/_components/`
- Rewrite copy that exposes implementation details or route names, including:
  - `Coming soon`
  - `onboarding`
  - `repeat behavior`
  - `private bucket`
  - raw route names such as `/evaluate` in visible prose
  - future-roadmap phrasing such as "먼저 ... 나중에 ..."
- Convert harsh command-style wording into helpful user guidance.
  - Avoid phrases like `저장해라`, `채워라`, `확인해라`.
  - Prefer `저장해 주세요`, `평가를 남기면 볼 수 있어요`, or a concise neutral state.
- Keep technical details in docs only, not in the rendered UI.
- Do not change data flow, routes, database schema, authentication, or form behavior in this ticket.

### Suggested copy direction

- Landing page:
  - Replace planning copy with a short product explanation.
  - Focus on "둘이 남기는 기록", "각자의 점수", "한줄평", and "좋았던 순간".
- Login page:
  - Replace route/onboarding wording with sign-in guidance.
- Dashboard:
  - Empty states should explain the next user action without mentioning internal paths.
- Evaluate page:
  - Keep field instructions practical and short.
  - Replace implementation terms with user concepts, e.g. `재방문 정책` instead of `repeat behavior` if needed.
- Detail page:
  - Explain photo upload as "이 기록에 사진을 남겨요", not storage mechanics.

### Acceptance criteria

- No visible UI copy contains `Coming soon`, `onboarding`, `repeat behavior`, or `private bucket`.
- Visible UI prose does not mention raw internal routes such as `/evaluate` or `/app`.
- Empty/error/success messages use a consistent polite-neutral Korean tone.
- Tests that assert visible copy are updated only where wording changed.
- No behavior changes are introduced.

### Validation

```bash
npm test
npm run lint
npm run build
```

## 15. Make the public landing page mobile-first and less demo-like

### Goal

Make the unauthenticated home page feel like a real Pairview entry point on mobile, not a design placeholder or product-planning mock.

### Scope

- Update `app/page.tsx`.
- Design for a mobile viewport first, then scale up for desktop.
- Keep the first screen focused on:
  - Pairview name
  - one short value proposition
  - Google sign-in CTA
  - 2-3 compact benefit chips or rows
- Remove or reduce demo-only sections such as `Snapshot` and `Marker rule` if they do not help a first-time user.
- If marker explanation remains, word it as user help:
  - Example: "특별히 좋았던 순간에는 마커를 남길 수 있어요."
- Avoid large desktop-only composition that creates awkward mobile scrolling.
- Do not add marketing pages, external images, or new dependencies.

### Acceptance criteria

- At 390px width, the main CTA is visible without excessive scrolling.
- Landing copy does not read like roadmap notes.
- The page remains visually consistent with Pairview's existing typography and colors.
- Desktop still renders cleanly, but mobile is the primary target.
- No authenticated app behavior changes.

### Validation

```bash
npm run lint
npm run build
```

Use Playwright or an equivalent browser check to inspect at least:

```text
390x844
1280x900
```

## 16. Add mobile-first workspace navigation

### Goal

Make the authenticated workspace easier to use on phones by making the primary navigation thumb-friendly and always predictable.

### Scope

- Update `app/_components/workspace-nav.tsx`.
- Keep the current destinations:
  - `/app`
  - `/evaluate`
  - `/history`
- On mobile, present navigation as a bottom bar or similarly thumb-friendly control.
- On wider screens, keep a compact top navigation if it fits the existing layout better.
- Ensure active state is clear without relying only on color.
- Account for safe-area inset on mobile browsers.
- Avoid adding icon libraries unless already available in the project.
- Do not change route names or page-level behavior in this ticket.

### Acceptance criteria

- `/app`, `/evaluate`, and `/history` all show a usable navigation control on mobile.
- The active page is visually identifiable.
- Bottom navigation does not cover important form buttons or page content.
- Keyboard focus states remain visible.
- Existing tests for navigation labels still pass or are updated to the new markup.

### Validation

```bash
npm test
npm run lint
npm run build
```

Use browser checks at mobile width for:

```text
/app
/evaluate
/history
```

## 17. Reflow dashboard for mobile-first usage

### Goal

Make `/app` useful as the first authenticated screen on a phone, prioritizing records and pending actions over stats.

### Scope

- Update `app/app/page.tsx`.
- Keep onboarding behavior for signed-in users without a pair.
- For users with a pair, order mobile content as:
  - short page header
  - `평가 대기`
  - `최근 기록`
  - `베스트 기록`
  - supporting counts or pair status
- Reduce the visual weight of summary count cards.
- Keep CTAs concise:
  - `평가 남기기`
  - `새 기록`
  - `전체 보기`
- Empty states should be short and helpful.
- Do not introduce new data queries if existing `getAppState()` data is enough.

### Acceptance criteria

- At mobile width, pending reviews and recent records appear before stat cards.
- The dashboard does not look like an admin analytics page.
- Existing recent, best, and pending sections remain present.
- No average score is introduced.
- Dashboard links still point to the correct routes.

### Validation

```bash
npm test
npm run lint
npm run build
```

Use browser checks at:

```text
390x844 /app
1280x900 /app
```

## 18. Reflow evaluation and history screens for mobile

### Goal

Make record entry and archive browsing comfortable on phones without changing the underlying workflows.

### Scope

- Update `app/evaluate/page.tsx` and `app/history/page.tsx`.
- Evaluate page:
  - Put pending/current review work before secondary setup panels where practical.
  - Keep the new-record form easy to find.
  - Avoid long explanatory paragraphs above the user's main action.
  - Keep marker setup available but visually secondary.
- History page:
  - Make filters less dominant on mobile.
  - Consider grouping filters behind a compact `필터` area or making the controls wrap cleanly.
  - Keep sort/search URL state behavior intact.
- Do not change API routes, schema, or history filtering semantics.

### Acceptance criteria

- Mobile evaluation flow makes it obvious where to add a record and where to review.
- Mobile history flow makes it obvious how to search, sort, and clear filters.
- Existing history query behavior is unchanged.
- No desktop regression in basic layout.
- Tests covering history and evaluation UI pass after copy/layout changes.

### Validation

```bash
npm test
npm run lint
npm run build
```

Use browser checks at mobile width for:

```text
/evaluate
/history
/history?sort=best
```

## Post-MVP invitation sharing tickets

These tickets improve the pair invitation UX from manual code entry to shareable links. Keep the existing single-use invitation semantics and pair-size protections. Work one ticket at a time.

## 19. Add a join-by-link page

### Goal

Let an invited partner open a link such as `/join?code=PAIRVIEW` and complete the join flow without manually finding the code entry form.

### Scope

- Add `app/join/page.tsx`.
- Read `code` from the query string.
- If the user is not authenticated, send them to `/login?next=/join?code=...`.
- If authenticated and `code` is present, show a focused confirmation screen with:
  - the invitation code,
  - a primary `커플에 합류하기` submit button,
  - a secondary link back to `/app`.
- Submit to the existing `app/api/pairs/join/route.ts` with the same `code` field.
- If `code` is missing, show a short fallback state that links to `/app` for manual entry.
- Do not change the database schema or invitation RPC.

### Acceptance criteria

- `/join?code=ABC123` renders a confirmation screen for signed-in users.
- Unauthenticated users are redirected through login and return to the join page via `next`.
- Missing code does not submit an empty join request.
- Existing pair onboarding and manual code entry still work.

### Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## 20. Replace invitation code display with share-link actions

### Goal

Make the owner-side invitation UX centered on copying or sharing an invitation link, while keeping the raw code visible as supporting information.

### Scope

- Add a small client component, for example `app/_components/invite-share-actions.tsx`.
- Inputs:
  - invitation `code`,
  - absolute or relative join URL.
- Provide:
  - `초대 링크 복사` using `navigator.clipboard.writeText`,
  - `공유하기` using `navigator.share` when available,
  - user-facing copied/error state.
- Update active invitation panels in:
  - `app/app/page.tsx`,
  - `app/evaluate/page.tsx` if the panel remains there.
- Build the join URL from `NEXT_PUBLIC_SITE_URL` when available, otherwise use `/join?code=...`.
- Keep the raw code visible but visually secondary.
- Do not expose any pair data in the link beyond the existing invitation code.

### Acceptance criteria

- Active invitations show a clear share-link action before the raw code.
- Copy works in browsers with clipboard support.
- Native share is only shown or enabled when supported.
- The raw code remains available for fallback/manual entry.
- No server-only environment variable is used in a client component.

### Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Use browser checks at:

```text
390x844 /app
1280x900 /app
```

## 21. Make manual invitation entry secondary

### Goal

Keep code entry as a fallback without making it the primary invitation UX.

### Scope

- Update the no-pair onboarding area in `app/app/page.tsx`.
- Keep pair creation prominent.
- Move manual join into a secondary area such as a collapsed `<details>` block labeled `초대 코드 직접 입력`.
- Add a short sentence that the usual flow is to open an invitation link.
- Keep the existing `/api/pairs/join` form and field names unchanged.
- Update visible copy from "초대 코드로 합류" to a fallback-oriented wording.

### Acceptance criteria

- New users still can join by manually entering a code.
- The initial onboarding screen no longer makes manual code entry look like the primary path.
- Copy clearly explains that invitation links are preferred.
- Existing tests that assert onboarding wiring are updated.

### Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## 22. Update invitation happy-path tests and docs

### Goal

Cover the new share-link join flow and document the expected invitation behavior.

### Scope

- Update `tests/e2e/pairview-happy-path.spec.ts` to join the second user through `/join?code=...` instead of filling the dashboard form directly.
- Add or update lightweight static tests for:
  - `app/join/page.tsx`,
  - the share action component,
  - login `next` preservation for `/join?code=...`.
- Update README or release/setup docs only if they currently mention manual invitation codes as the primary flow.
- Keep manual code entry covered as a fallback where practical.

### Acceptance criteria

- E2E happy path covers:
  - owner creates pair,
  - invite link is available,
  - partner opens `/join?code=...`,
  - partner joins successfully,
  - the rest of the review/history flow still passes.
- Static tests prevent accidental removal of the join page and share-link UI.
- Documentation reflects link-first invitation UX.

### Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

## Post-MVP auth persistence tickets

These tickets address the issue where a user can appear signed in immediately after Google login but lose the authenticated workspace on refresh. The likely root cause is a mismatch between client-side Supabase auth state and the server-side cookies that middleware and Server Components read.

Work one ticket at a time. Keep fixture-only E2E behavior intact and do not require real Google OAuth in automated tests.

## 23. Keep Google Identity Services but exchange the credential server-side

### Goal

Keep the Google account chooser/popup UX, but make Google login create a server-readable Supabase session cookie so refreshes, direct route loads, and middleware checks all see the same authenticated state.

### Scope

- Update `app/login/login-panel.tsx`.
- Keep Google Identity Services button rendering and nonce generation.
- Send the Google credential to a server route, for example `app/api/auth/google/route.ts`.
- In the server route, call `supabase.auth.signInWithIdToken({ provider: "google", token, nonce })`.
- Let the server route sync the user profile after the session is established.
- Keep the E2E fixture login branch unchanged.
- Keep user-facing loading and error states.
- Do not change database schema, pair onboarding, invitation RPC behavior, or the `/join` link flow.

### Acceptance criteria

- Clicking the production login button opens the Google account chooser without exposing `supabase.co`.
- The server route exchanges the credential for a Supabase session and sets cookies readable on refresh.
- After login, the user lands on `safeNextPath(next)`.
- Refreshing `/app`, `/evaluate`, `/history`, and `/join?code=...` keeps the user authenticated when the Supabase session is valid.
- E2E fixture login still works without external Google or Supabase dependencies.

### Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Manual production or preview check:

```text
1. Open `/login?next=/app`.
2. Complete Google login.
3. Confirm `/app` loads.
4. Refresh `/app`.
5. Confirm the user stays in the workspace instead of returning to `/login`.
```

## 24. Harden server-side Supabase session checks

### Goal

Ensure middleware and Server Components agree on authentication and refresh Supabase cookies consistently after the server-side credential exchange.

### Scope

- Review `middleware.ts`, `lib/supabase/server.ts`, `lib/auth/server.ts`, and the Google auth route.
- Prefer the Supabase SSR-recommended server auth check for protected routes.
- If `getClaims()` is unreliable for refresh behavior, replace or wrap it with `supabase.auth.getUser()` in server-side auth checks.
- Keep `createServerClient` cookie `getAll` and `setAll` behavior compatible with:
  - middleware response cookies,
  - Server Component cookies,
  - Route Handler cookies.
- Preserve E2E fixture mode in middleware and app state loading.
- Ensure `/join` auth gating uses the same server-side user resolution path as the rest of the app, with fixture mode still supported.

### Acceptance criteria

- Protected routes redirect unauthenticated users to `/login`.
- Authenticated users are not redirected away from protected routes after refresh.
- `/login` redirects already-authenticated users to `/app`.
- Server Components can load the current user after a hard refresh.
- No auth code path depends only on browser-local session state.

### Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Manual check:

```text
Refresh these pages while signed in:
/app
/evaluate
/history
/join?code=<active-code>
```

## 25. Add auth persistence regression coverage

### Goal

Prevent future changes from reintroducing client-only login behavior or breaking `next` preservation.

### Scope

- Update `tests/auth.test.mjs` or add a focused auth wiring test.
- Assert that `app/login/login-panel.tsx` loads Google GIS and posts the credential to `/api/auth/google`.
- Assert that `app/api/auth/google/route.ts` uses `signInWithIdToken`.
- Assert that login preserves `next` through the login form and server route.
- Extend fixture E2E only where useful:
  - unauthenticated protected route redirects to login,
  - fixture login redirects back to the requested `next`,
  - hard refresh of a protected fixture route remains authenticated.
- Do not add tests that require real Google OAuth credentials.

### Acceptance criteria

- Static tests catch accidental reintroduction of OAuth redirect login.
- E2E still covers sign-in boundary and protected route refresh behavior in fixture mode.
- Invitation join links continue to preserve `next` through login.

### Validation

```bash
npm test
npm run lint
npm run typecheck
npm run test:e2e
```

## 26. Update auth setup and release docs

### Goal

Make the required Google/Supabase/Vercel auth setup clear now that login depends on Google Identity Services and a server-side credential exchange.

### Scope

- Update `README.md` and `docs/RELEASE.md`.
- Document the required Supabase Google provider setup.
- Document Google Cloud Console requirements:
  - authorized JavaScript origins,
  - the Web client ID used by Google Identity Services.
- Add a release checklist item for refresh persistence after login.
- Keep secrets out of docs; only list variable names and URL shapes.

### Acceptance criteria

- A future operator can configure Google/Supabase auth without guessing which client ID or server route is used.
- Release docs include a refresh-after-login check.
- README does not imply an OAuth redirect flow or client-only login.
- No secrets or project-specific private keys are added.

### Validation

```bash
npm test
npm run lint
```

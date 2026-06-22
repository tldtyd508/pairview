# Pairview agent guide

## Product

- Pairview records one shared experience with two independent reviews.
- Do not average or rank the partners' scores against each other.
- The MVP supports restaurants, but the domain model must allow other kinds of subjects later.
- Everything is private to a pair. Never expose one pair's data to another pair.
- Read `docs/PRODUCT.md` before changing product behavior.
- Follow `PLAN.md` for implementation order and unresolved decision gates.

## Engineering

- Use Next.js App Router, TypeScript, and Tailwind CSS.
- Prefer Server Components. Add Client Components only for browser state or interaction.
- Use Supabase for Google authentication, Postgres, row-level security, and image storage.
- Keep secrets in environment variables. Commit only `.env.example`, never `.env*` credentials.
- Keep UI minimal, mobile-first, accessible, and written in Korean for the MVP.
- Avoid new production dependencies unless the platform does not reasonably cover the need.

## Workflow

- Complete one numbered `PLAN.md` task at a time.
- Before editing, restate the task scope and inspect the affected files.
- Do not silently decide items marked `OPEN DECISION`.
- After each task, run the relevant lint, type-check, test, and build commands.
- Keep the working tree scoped to the active task and summarize changed files and checks.
- Do not use the Vercel CLI. Push to GitHub; the user manages the Vercel project connection.

## Definition of done

- The task's acceptance criteria are met.
- Loading, empty, error, and success states are handled where relevant.
- Authorization is enforced in the database, not only hidden in the UI.
- Lint, type-check, tests, and production build pass, or the exact blocker is reported.

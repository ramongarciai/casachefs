# Casa Chefs — Build Progress

## Locked policy decisions (2026-09-09)

- **Gaps** (budgets between bands, or below $8.20 / above $40.00): route to a "let's talk" callback screen, no explanation shown.
- **Tax**: always added on top and itemized separately, even for fixed (Mode B) budgets.
- **Payments**: offline invoicing only at launch — no Stripe.
- **Gratuity**: automatic and locked on `CAT_STD` / `CAT_PREM`, not customer-editable.
- **Minimums**: box lunch 5 guests / 2 days lead; event catering 15 guests / 5 days lead; 30-mile delivery radius from Magnolia/The Woodlands. Stored in an admin-editable settings table.
- **Frozen food**: pickup only for now, no delivery fee/minimum logic.

## Phase 1 — Scaffold ✅ done

- Next.js 16 (App Router, Turbopack) + TypeScript strict + Tailwind v4 + shadcn/ui (Base UI primitives).
  - Spec asked for Next.js 15; 16 is the current stable release as of this build (Sept 2026), so we scaffolded on latest instead. Flag if you want to pin back to 15.
- Drizzle ORM configured against Postgres (`src/db`), `drizzle.config.ts`, `npm run db:generate` / `db:migrate` / `db:studio`.
- Auth.js v5 (`src/auth.ts`) with Google + Resend (email magic link) providers, Drizzle adapter, `role` enum (`customer` / `staff` / `admin`) on the `users` table, database session strategy.
- Role-gated admin shell at `/admin` (`src/app/(admin)/admin/layout.tsx`) — redirects to `/login` if signed out, redirects to `/` if role is `customer`. Placeholder dashboard page.
- `/login` and `/login/check-email` pages with Google + magic-link sign-in forms.
- `.env.example` documents required env vars. `.env.local` holds local dev placeholders (git-ignored) — real credentials still needed before this actually works end-to-end.
- Verified: `tsc --noEmit`, `eslint`, `next build`, and a dev-server smoke test of `/`, `/login`, `/login/check-email`, `/admin` (redirect behavior confirmed).

### Still needed before this phase is "real" (not blocking further phases, but blocking a live deploy)

- Real `DATABASE_URL` (Supabase or Neon) and running the initial migration.
- Real `AUTH_SECRET`, Google OAuth client ID/secret, Resend API key + verified sending domain.
- Deploying to Vercel + connecting the database.

## Phase 2 — Menu manager: not started

## Phase 3 — Pricing engine: not started

## Phase 4 — Customer wizard: not started

## Phase 5 — Accounts (reorder, saved addresses): not started

## Phase 6 — Admin review workspace: not started

## Phase 7 — Approval + documents: not started

## Phase 8 — Frozen food module, polish, SEO, analytics: not started

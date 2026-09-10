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

## Phase 2 — Menu manager ✅ done

- Schema (`src/db/schema/menu.ts`, `pricing.ts`): `menu_items` (bilingual name/description, category, spice level, 8 dietary booleans, allergen array, internal cost, frozen-only published price/unit, active/availability/min-qty/lead-time, `isSample` flag), `menu_item_photos`, `pricing_bands` (seeded with the 4 real bands from the spec), `band_menu_items` join table.
- Local dev database: no Postgres was provisioned yet, and this machine has no Docker/local Postgres either, so added an embedded **PGlite** (WASM Postgres) driver behind `DATABASE_URL=pglite://...` for local dev/testing only — `src/db/index.ts` picks postgres-js vs. PGlite based on the URL scheme; production always uses real Postgres. Required adding `@electric-sql/pglite` and `sharp` to `serverExternalPackages` in `next.config.ts` — Turbopack bundling them broke their internal fs calls at runtime (a real bug caught by testing on the actual server, not just `tsc`).
- `npm run db:migrate` / `db:seed` scripts (driver-agnostic, work against either PGlite or real Postgres) — seeded the 4 pricing bands plus **25 sample menu items** (bilingual, realistic, across all 10 categories including frozen), each flagged `isSample: true` and rendered with a visible "Sample" badge in the admin UI per the spec's "never present seed data as final" rule.
- Full CRUD at `/admin/menu`: list with search/category filter/bulk select, create/edit form (category, bilingual name/description, spice level, 8 dietary toggles, 9 allergen checkboxes, internal cost, band-assignment checkboxes for non-frozen items, published price + unit for frozen items, active switch, min quantity, lead time), bulk activate/deactivate/duplicate/assign-to-band.
- Photo manager: drag-and-drop upload (auto-fills alt text, editable afterward), reorder via native drag-and-drop, set-primary, delete. `sharp` converts every upload to WebP and generates thumb/medium/large variants. Storage defaults to `public/uploads` locally; switches to Supabase Storage automatically once `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set (untested — no bucket provisioned yet).
- Every server action re-checks `requireStaff()` independently (not just the layout), since server actions can be invoked directly and bypass page-level redirects.
- Verified for real, not just type-checked: ran migration + seed against the local PGlite DB, then hit `/admin/menu`, `/admin/menu/new`, and `/admin/menu/[id]` on both `next dev` and a production `next build` + `next start`, using a manually-seeded admin session cookie (no real Google/Resend creds exist yet). Confirmed the list renders all 25 items with correct badges, and confirmed the photo pipeline actually produces valid 3-size WebP files end-to-end.
- Also fixed a Phase 1 gap: `next start` (production mode) needs `AUTH_TRUST_HOST=true` for Auth.js to trust the host header when self-hosting (Vercel sets this automatically) — added to `.env.local`/`.env.example`.

### Still needed before this is fully "real"

- Real Postgres (Supabase/Neon) — swap `DATABASE_URL` and re-run `db:migrate` + `db:seed`; PGlite is dev-only.
- Real Supabase Storage bucket if that's the chosen photo host (or swap to Cloudinary) — the local `public/uploads` fallback works but isn't durable across deploys.
- No hard-delete for menu items yet (spec only asked for active/inactive) — flag if you want deletion too.

## Phase 3 — Pricing engine: not started

## Phase 4 — Customer wizard: not started

## Phase 5 — Accounts (reorder, saved addresses): not started

## Phase 6 — Admin review workspace: not started

## Phase 7 — Approval + documents: not started

## Phase 8 — Frozen food module, polish, SEO, analytics: not started

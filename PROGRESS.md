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

## Phase 3 — Pricing engine ✅ done

- `src/lib/pricing/` — pure functions, no UI, no DB access (dependency-injected instead), exactly as the spec asked:
  - `resolveBand()` implements the spec's pseudocode literally (divide by guests, then by the band's fee %, for Mode B classification). Added a `1e-6` cent floating-point epsilon on the boundary comparison — without it, Mode B's division can miss an exact integer-cent boundary by a fraction of a cent. `gapPolicy()` is the single function implementing the locked Q1 decision (no band assigned, no explanation) for anything between bands or outside $8.20–$40.00.
  - `calculateTotals()` implements section 2.4 exactly, mode-aware: Mode A charges the customer's typed per-person number verbatim and adds delivery/tip/tax on top; Mode B back-solves `food_subtotal` from the fixed total first and derives price-per-person from that, never the reverse. Also exports `computeBudgetOverageCents()` for the Mode B guardrail phase 6 will need.
  - **Tax base is a judgment call, not one of the six locked decisions**: computed on food + add-ons + delivery, excluding gratuity. Flag this to an accountant before it handles real money — it's isolated to one line in `totals.ts` if it needs to change.
  - `dto.ts` — `toPublicMenuItem()` is a strict field allowlist (never a spread) and `filterMenuItemsForQuote()` combines band eligibility, active/availability window, and allergen exclusion.
  - `buildQuote()` composes all of the above into the one function a customer-facing route will call once the phase 4 wizard exists.
- `fee_rules` table (singleton row): tax rate (8.25%, Houston-area default) plus the Q5 minimums (box lunch 5 guests/2 days, catering 15 guests/5 days, 30-mile radius) — consolidated here since the spec's data model doesn't list a separate settings table.
- Fixed a naming inconsistency from phase 2 while touching this code: `pricingBands.deliveryPct`/`.tipPct` (TS property names) are renamed to `.deliveryPctBps`/`.tipPctBps` to match what they actually store (basis points, not raw percent) — no DB migration needed, the SQL column names were already `_bps`-suffixed. Extracted the 4 real bands into `src/db/pricing-bands-data.ts` so `seed.ts` and the test fixtures share one source of truth instead of two hand-typed copies that could drift apart.
- **41 unit tests, all passing** (`npm run test`, Vitest): both budget modes at all 8 spec boundaries ($8.20/$9.99/$12/$15/$24/$31.99/$32/$40), one value inside each named gap (both modes), the totals formulas verified with hand-computed expected numbers, item-filtering edge cases (allergens, inactive, availability window), and `tests/no-leak.spec.ts` asserting `buildQuote()`'s output never contains `band`/`tier`/`internal_cost`/`cost`/`margin`/`min_pp`/`max_pp`/any of the 4 band codes.
- **Leak test caveat**: no customer-facing route exists yet (that's phase 4), so this test exercises `buildQuote()` directly rather than an HTTP endpoint. Once phase 4 wraps it in a server action/API route, re-point or duplicate this assertion at the wire-format response so it covers the actual public surface too.
- Also verified the full app still builds/lints/typechecks clean after these changes. Noticed the local PGlite dev DB occasionally throws a `RuntimeError: Aborted()` under `next build`'s parallel static-generation workers (a concurrency quirk of the embedded WASM DB when multiple build workers hit the same on-disk store at once) — intermittent, doesn't affect build output, and won't occur in production against real Postgres. Not worth engineering around for a dev-only fallback.

## Phase 4 — Customer wizard: not started

## Phase 5 — Accounts (reorder, saved addresses): not started

## Phase 6 — Admin review workspace: not started

## Phase 7 — Approval + documents: not started

## Phase 8 — Frozen food module, polish, SEO, analytics: not started

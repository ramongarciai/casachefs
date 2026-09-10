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

## Phase 4 — Customer wizard ✅ done

- `/order` — the 6-step wizard (`src/app/order/`), mobile-first, one decision per screen, progress bar, back never loses data (draft held in React state + mirrored to `localStorage` on every change, restored on load). Frozen food (step 1's 5th card) routes to a `/order/frozen` "coming soon" stub — its real catalog flow is phase 8/section 5 scope, not this budget-driven wizard.
  - **Step 1**: 5 service-type cards.
  - **Step 2**: date/time/guest count/address, validated client-side against `fee_rules`' admin-editable minimums (fetched server-side, passed down as props — never hardcoded). Delivery-radius is informational copy only; enforcing it for real needs a geocoding API key we don't have, flagged below.
  - **Step 3**: allergen/diet/low-spice chips, each capturing an affected-guest count, plus free text — stored in the draft, persisted as `order_restrictions` rows on submit.
  - **Step 4**: the per-person/total toggle with the exact spec-mandated copy ("added on top" vs "included"), calls the new `getQuoteAction` server action.
  - **Step 5**: shows the curated packages for the resolved band (never the band itself) with per-category item swaps; a package is only offered if every one of its items survives the customer's declared restrictions. Summary bar shows price-per-person only, never a per-item price.
  - **Step 6**: contact form + full itemized preview labeled "Preliminary request — not a confirmed order," submits via `submitOrderAction`.
  - **Gap screen**: shown whenever `resolveBand` returns "gap" — a plain callback form (name/email/phone/note), no explanation of why, persisted to a new `callback_requests` table.
- **Extended the pricing engine** (`src/lib/pricing/dto.ts`, `buildQuote.ts`) with `requiredDiets` and `maxSpiceLevel` filtering (diet booleans and the "low-spice" restriction weren't needed until the wizard actually had to filter on them) — added 2 more passing tests for this, no regressions to the 41 from phase 3.
- **New schema**: `addresses`, `orders`, `order_items`, `order_restrictions`, `callback_requests`, `packages`, `package_items`. `orders.bandCode` and all cost fields are populated but — like everywhere else in this codebase — never serialized to a customer-facing response; the wizard's server actions only ever return the `buildQuote()`-shaped DTO.
- **Every total is recomputed from scratch server-side at submission time** (`submitOrderAction` calls `resolveBand`/`calculateTotals` again from the raw inputs, never trusting the client-cached quote) — protects against a stale quote or a tampered request. Submitted item IDs are also re-filtered against a freshly computed eligibility set before being persisted.
- **Packages are seed-only** — 2 curated packages per band (8 total, built from the phase-2 sample items, sharing one source of truth via `src/db/pricing-bands-data.ts`-style keying in `seed.ts`). There's no admin CRUD for packages yet (menu manager only covers items); flagged below since a real admin will eventually need to curate these instead of me hand-editing `seed.ts`.
- **Emails** (`src/lib/email.ts`): order confirmation to the customer, notification to `ADMIN_NOTIFICATION_EMAIL`, and a magic-link sign-in triggered via `signIn("resend", { redirect: false })` — all three are best-effort (`Promise.allSettled`, logged not thrown) so a Resend outage can never lose a submitted order. Untestable end-to-end here since `AUTH_RESEND_KEY` is still a placeholder.
- **Verified with a real headless browser, not just `tsc`/curl** — this wizard is entirely client-rendered until hydration (curl only sees an empty shell), so I installed Puppeteer and drove the actual UI. This machine runs macOS 12.7.6, and current Chrome-for-Testing builds refuse to launch on it (`dlopen` failure — needs a newer macOS `VideoToolbox`); had to pin an older Chrome build (`120.0.6099.109`) to get a working headless browser at all. Ran two full flows end to end and confirmed the resulting DB rows directly:
  - Happy path: event catering, $30/person, shellfish allergy declared → correctly resolved `CAT_STD`, shellfish item excluded from both the shown items and swap alternatives, order + 6 order_items + 1 order_restriction + address + new customer user all created correctly, `grandTotalCents` matched the hand-verified formula exactly (72899 = 60000 food + 1800 delivery + 6000 tip + 5099 tax).
  - Gap path: box lunch, $11.00/person (inside the $10–$11.99 gap) → correctly showed the "let's talk" screen with no explanation, callback form submission persisted to `callback_requests`.
- **Found and fixed a real bug this way**: `/order` was being statically prerendered at build time (baking in whatever `fee_rules` existed in the DB at build time), because reading from the DB isn't automatically treated as a dynamic signal by Next's static-by-default rendering. Added `export const dynamic = "force-dynamic"` — this route must always reflect live, admin-editable settings.
- **Found a real limitation of the PGlite dev fallback**: after the Puppeteer run's burst of concurrent queries, the on-disk PGlite store became unreadable (`RuntimeError: Aborted()` on every subsequent query, not just the flaky one-off noted in phase 3) and had to be wiped and reseeded to recover. This is specific to the embedded WASM dev database under concurrent load — real Postgres via postgres-js doesn't have this failure mode. Treat local PGlite as fine for quick manual checks, but don't be surprised if a heavy local test run corrupts it; `rm -rf .pglite-data && npm run db:migrate && npm run db:seed` recovers it in seconds.

### Deliberately deferred to phase 5 (Accounts) per the build-phase split

- No saved-address reuse or the "same address as last time or new address?" prompt — every wizard run today is anonymous-first; a signed-in returning customer isn't pre-filled or offered "Reorder" yet.
- The account created at step 6 is a bare `users` row (email/name/role=customer) — no dedicated `customer_profiles` record, no order-history view for the customer yet.

### Still needed / gaps to flag

- Delivery-radius (30mi) is informational copy only, not enforced — needs a geocoding API key.
- No admin UI to curate packages — they're seed-data only, edit via Drizzle Studio or re-seed for now.
- Emails are wired up but unverified against a real Resend account/domain.

## Phase 5 — Accounts (reorder, saved addresses) ✅ done

- **`/account`** (`src/app/account/page.tsx`): requires sign-in (redirects to `/account/login` otherwise), shows de-duplicated saved addresses and full order history (status, date/time, guest count, grand total, item names, a **Reorder** button per order). Any signed-in user can view it — not role-gated to `customer` specifically.
- **`/account/login`**: same Google + magic-link pattern as staff `/login`, but customer-branded copy and redirects to `/account`. Kept as a separate page from `/login` rather than generalizing one shared page — avoided touching the already-tested staff/admin login flow.
- **Reorder** (`src/app/account/reorder.ts`, `reorder-button.tsx`): reconstructs a `WizardDraft` from a past order (`order_type`, restrictions, budget, selected items/package) and writes it straight to the wizard's `localStorage` key before navigating to `/order` — the wizard picks it up through the exact same hydration path a normal in-progress draft uses, no wizard-side special-casing needed. Per spec, only *what* to order carries over: the draft starts at **step 2** (skipping re-picking service type) with **date, time, guest count, and address all blank** — never silently reused.
- **The "same address as last time, or a new address?" prompt** (step 2): any signed-in customer with saved addresses sees a radio choice — their most recent address (labeled), any other saved addresses, or "Enter a new address" — with **nothing selected by default** and Continue disabled until they choose. Selecting a saved address fills the (still-editable) fields; selecting new clears them.
- **Contact pre-fill**: `/order/page.tsx` now fetches the session and, if signed in, the user's name/email/phone, passed to the wizard as `initialContact`. Applied whenever the draft's contact is still empty — covers both a fresh signed-in visit and a reorder draft (which never carries contact info) with one code path.
- **Fixed a real Phase-4 gap while wiring this up**: `submitOrderAction` never persisted the customer's phone number on account creation, so "pre-fill phone" had nothing to read. Now sets it on a new user and backfills it for a returning customer whose profile predates it.
- **Magic-link callback**: the post-submit sign-in email now sends the customer to `/account` (`callbackUrl: "/account"`) instead of the default admin-oriented destination.
- **Verified with the same real-browser approach as phase 4** — placed an order anonymously, seeded a session for that customer, then drove `/account` and the full reorder flow through Puppeteer:
  - Confirmed order history renders correctly (right items, status, total) and the saved address shows.
  - **Found and fixed a real bug this way**: the first reorder attempt showed contact fields blank on step 6 — `buildDraftFromOrder()` writes a draft to `localStorage` before navigating, so the wizard's "only pre-fill contact if there's no saved draft" branch never ran for a reorder. Restructured the hydration effect to merge `initialContact` in whenever `draft.contact.email` is empty, regardless of where the rest of the draft came from. Re-verified: contact and budget both pre-fill correctly now.
  - Ran a full reorder to submission with a different guest count (15 vs. the original 8) and confirmed the grand total recalculated correctly from scratch ($146.14, hand-verified) rather than reusing anything stale — and that both orders then appeared correctly in order history.
  - Confirmed `/account` redirects an unauthenticated visitor to `/account/login` (307).

### Deliberately out of scope here

- No address edit/delete UI — addresses only ever get created as a side effect of submitting an order; `/account` just lists and de-dupes them for display.
- No "order detail" page — history rows show a summary only, not the full BEO-style breakdown (that's more of an admin/phase-7 concern; a customer-facing detail view can be added later if wanted).

## Phase 6 — Admin review workspace ✅ done

- **Add-on catalog** (`/admin/addons`): full CRUD across the 6 spec categories (staff, furniture, linens, tableware, decor, beverages), each with a billing unit (per item/person/hour/person-hour/flat) and a dynamic variant list (color/style) so one record covers e.g. "napkins" in every color instead of 30 rows. Seeded with 26 sample add-ons. Same list/bulk-activate pattern as the menu manager, minus photos (not needed for logistics items).
- **Order pipeline** (`/admin/orders`): list with status, allergy/diet badge, and grand total; links into...
- **Order review workspace** (`/admin/orders/[id]`), split screen exactly per spec 4.3:
  - **Left (read-only)**: the customer's submitted request — contact, event details, address, original budget, quote-version history.
  - **Right (editable)**: items (add/remove/adjust quantity from the *full* catalog, not just the band-eligible set — admin has full control), event add-ons (catalog picker with variant selection), delivery/gratuity/tax **percentage overrides** (blank = band/fee_rules default), a discount or surcharge that **requires a reason** (enforced server-side, not just in the UI), internal notes (admin-only) vs. customer-facing notes, and a live **margin panel** (food cost vs. price, gross margin $ and %, admin-only).
  - **Allergy banner** pinned at the top whenever the order has any restrictions.
  - **Mode B overage warning**: uses phase 3's `computeBudgetOverageCents()` — if the order was a fixed-total budget and add-ons/overrides push the grand total past it, a persistent red banner says so.
- **The core pricing rule enforced correctly**: swapping menu items or changing quantities affects the **margin panel only** — the customer's food price is fixed once the wizard resolves a band, so only add-ons, fee overrides, and discount/surcharge can move the customer-facing total. This is the single most important thing to get right in this phase, and it's what `calculateAdminTotals()` (new, in `lib/pricing/`, 4 new tests) actually encodes.
- **`quotes` table (versioning)**: every "Send revised quote" click snapshots the order's current totals as an immutable, incrementing-version row and flips `orders.status` to `quote_sent`. Item/add-on *lists* are read live from the order at render time rather than also snapshotted — a scoped simplification (see below).
- **`/quote/[id]`**: minimal read-only stub so the emailed link actually goes somewhere real — shows the itemized quote, no Approve/Decline yet. The full customer approval flow, PDF, and locking-on-approval are phase 7 (spec 4.4).
- Every mutation (items, add-ons, overrides) immediately recomputes and persists `orders`' totals via a shared `recomputeAndSaveOrderTotals()` helper, so the order row always reflects live current state — "Send revised quote" just snapshots whatever's already there.
- **Verified with the same real-browser approach**: placed a $35/person, 40-guest event-catering order (resolved to `CAT_PREM`), then as a seeded admin session drove the full review workspace — added 50 server-hours as an add-on, overrode delivery to 5%, applied a $50 discount with a reason, saved, sent a revised quote, and hand-verified every resulting number against the DB (margin: $960 food cost / $440 gross margin / 31.4% off a $1400 food subtotal for 7 items × 40 guests; final quote: $2175.93, matching the formula to the cent). Confirmed `/quote/[id]` renders the same numbers with zero band-code or internal-cost leakage (grepped for it).
- One real bug hit during testing: a `page.locator(...).click()` intermittently missed the "Send revised quote" button (Puppeteer-specific auto-wait flakiness against this Base UI button, not an app bug) — confirmed by clicking it via direct DOM dispatch instead, which worked immediately and consistently on retry.

### Deliberately scoped down

- Quotes snapshot **financial totals only**, not the item/add-on list — if the admin edits items after sending a quote but before the customer responds, the quote's displayed items would reflect the latest state, not the exact historical snapshot. Full immutability (needed for "approved quotes lock") is phase 7 scope.
- No delete for add-ons (mirrors the menu manager's active/inactive-only precedent from phase 2).
- `/quote/[id]` has no Approve/Request changes/Decline actions, no signature capture, no PDF — all phase 7.

## Phase 7 — Approval + documents ✅ done

- **`/quote/[id]` is now fully interactive** (spec 4.4): Approve (types full name as signature, timestamp + IP captured automatically), Request changes (feedback note), or Decline — each writes an immutable `quote_approvals` row and notifies the admin by email for changes/decline. Approving flips `orders.status` to `approved` and records `approvedQuoteId`; declining flips it to `cancelled`.
- **New `quote_approvals` table** — one row per customer response, never edited after the fact.
- **Re-approval enforcement, the trickiest part of this phase**: any admin edit after approval — items, add-ons, *or* fee overrides — reverts the order to `in_review`, so the next "Send revised quote" creates v2 and requires fresh approval. Initially only wired this into the add-on/override recompute path; **testing caught that item edits didn't trigger it** (adding a menu item to an approved order left it silently `approved`). Fixed with a shared `revertApprovalIfNeeded()` helper called from `replaceOrderItems` too. Verified end-to-end: v1 stays immutably `approved` in its own row while v2 is created fresh — a real bug that only real interaction testing would have caught, since unit tests wouldn't have covered the item-vs-addon code path split.
- **PDF generation** (`@react-pdf/renderer`, added to `serverExternalPackages` proactively given phases 2/3's pglite/sharp precedent — didn't need to debug it this time):
  - `GET /api/quotes/[id]/pdf` — the approved/pending quote, itemized, with signature info once approved. No auth required (same unguessable-UUID model as the `/quote/[id]` page itself).
  - `GET /api/admin/orders/[id]/beo` — the BEO/kitchen sheet: allergy alerts in a red box at the top, item/packing-list counts, delivery window + driver notes (two new admin-editable order fields), contact phone. Admin-only.
  - Verified both actually produce valid PDF files (checked with `file`), not just that the route returns 200.
- **Found and fixed a real auth bug while testing**: both admin-only PDF/CSV route handlers returned a bare framework 500 for an unauthenticated request instead of 401, because `requireStaff()`'s thrown error was never caught inside a Route Handler (unlike server actions, where Next.js handles that automatically). Wrapped both in try/catch; verified 401 unauthenticated / 200 authenticated.
- **Calendar** (`/admin/calendar`): a real month grid (not just a list), prev/next navigation via `?month=YYYY-MM`, orders plotted on their event date linking into the review workspace.
- **Dashboard** (`/admin`): pipeline counts per status (all 9 statuses shown, including zero-count ones) plus an upcoming-events list, both backed by real queries now instead of the phase-1 placeholder.
- **CSV export** (`/api/admin/orders/export`): one row per order, admin-only.
- Verified the whole approval lifecycle with the same real-browser approach as phases 4-6: placed an order, sent v1, approved it as the customer (signature + IP recorded correctly), edited it as admin (confirmed the re-approval bug above), sent v2, and confirmed both quote PDF and BEO PDF render correctly with the right numbers.

### Deliberately scoped down

- No BEO customization UI beyond delivery window / driver notes — dietary variant *counts* on the BEO are the raw restriction rows (allergen/diet/spice + affected guest count), not a further-aggregated summary; sufficient for a kitchen sheet, more polish possible later.
- Calendar has no drag-to-reschedule or multi-event-per-day layout refinement — a day cell just lists events, which is fine at this order volume.
- No customer-facing view of quote version history (v1 vs v2) — each emailed link points at one specific version; the admin workspace's quote-history card is the only place all versions are browsable.

## Phase 8 — Frozen food module, polish, SEO, analytics: not started

import type { Band, BudgetMode, QuoteTotals, ServiceLine } from "./types";
import { resolveBand } from "./resolveBand";
import { calculateTotals } from "./totals";
import { filterMenuItemsForQuote, type MenuItemForFiltering, type PublicMenuItem } from "./dto";

export interface BuildQuoteInput {
  serviceLine: ServiceLine;
  mode: BudgetMode;
  amountCents: number;
  guestCount: number;
  excludedAllergens?: string[];
}

export interface BuildQuoteDeps {
  bands: Band[];
  menuItems: MenuItemForFiltering[];
  /** bandCode -> ids of menu items assigned to that band. */
  bandMenuItemIds: Record<string, string[]>;
  taxRateBps: number;
  addonsSubtotalCents?: number;
  now?: Date;
}

export type BuildQuoteResult =
  | ({ status: "ok"; items: PublicMenuItem[] } & QuoteTotals)
  | { status: "gap" };

/**
 * The single function a customer-facing route ultimately calls (wired up in
 * the phase 4 wizard). Never returns a band code, boundary, or cost figure —
 * see tests/no-leak.spec.ts, which asserts on this function's output.
 */
export function buildQuote(input: BuildQuoteInput, deps: BuildQuoteDeps): BuildQuoteResult {
  const outcome = resolveBand(input.serviceLine, input.mode, input.amountCents, input.guestCount, deps.bands);

  if (outcome.status === "gap") {
    return { status: "gap" };
  }

  const totals = calculateTotals({
    mode: input.mode,
    amountCents: input.amountCents,
    guestCount: input.guestCount,
    band: outcome.band,
    addonsSubtotalCents: deps.addonsSubtotalCents,
    taxRateBps: deps.taxRateBps,
  });

  const eligibleItemIds = deps.bandMenuItemIds[outcome.band.code] ?? [];
  const items = filterMenuItemsForQuote({
    items: deps.menuItems,
    eligibleItemIds,
    excludedAllergens: input.excludedAllergens,
    now: deps.now,
  });

  return { status: "ok", items, ...totals };
}

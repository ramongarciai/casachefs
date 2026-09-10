"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { calculateMargin, computeBudgetOverageCents } from "@/lib/pricing";
import { ItemsEditor } from "./items-editor";
import { AddonsEditor } from "./addons-editor";
import { QuoteControls } from "./quote-controls";
import { OrderStatusSelect } from "./order-status-select";

export interface Item {
  id: string;
  menuItemId: string;
  quantity: number;
  nameEn: string;
  category: string;
  internalCostCents: number;
}

export interface AddonLine {
  id: string;
  addonId: string;
  addonVariantId: string | null;
  quantity: number;
  unitPriceCentsSnapshot: number;
  notes: string | null;
  nameEn: string;
  variantNameEn: string | null;
}

export interface CatalogMenuItem {
  id: string;
  nameEn: string;
  category: string;
  internalCostCents: number;
}

export interface CatalogAddon {
  id: string;
  nameEn: string;
  category: string;
  unit: string;
  unitPriceCents: number;
  variants: { id: string; nameEn: string }[];
}

export interface Restriction {
  type: string;
  value: string;
  affectedGuestCount: number | null;
  note: string | null;
}

export interface OrderForWorkspace {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string | null;
  orderType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  budgetMode: string;
  budgetAmountCents: number;
  pricePerPersonCents: number;
  foodSubtotalCents: number;
  addonsSubtotalCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
  surchargeCents: number;
  discountSurchargeReason: string | null;
  grandTotalCents: number;
  status: string;
  customerNotes: string | null;
  internalNotes: string | null;
  deliveryWindow: string | null;
  driverNotes: string | null;
  deliveryPctOverrideBps: number | null;
  tipPctOverrideBps: number | null;
  taxRateOverrideBps: number | null;
}

export interface AddressForWorkspace {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
}

export interface QuoteHistoryRow {
  id: string;
  version: number;
  grandTotalCents: number;
  status: string;
  createdAt: Date;
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  event_catering: "Event Catering",
  box_lunch_employee: "Employee Box Lunch",
  box_lunch_training: "Training Box Lunch",
  box_lunch_breakfast: "Breakfast Box Lunch",
  frozen_food: "Frozen Food",
};

const RESTRICTION_LABELS: Record<string, string> = {
  allergen: "Allergen",
  diet: "Diet",
  spice: "Spice",
  other: "Other",
};

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function OrderReviewWorkspace({
  order,
  address,
  restrictions,
  items,
  addons,
  catalogMenuItems,
  catalogAddons,
  band,
  defaultTaxRateBps,
  quoteHistory,
}: {
  order: OrderForWorkspace;
  address: AddressForWorkspace | null;
  restrictions: Restriction[];
  items: Item[];
  addons: AddonLine[];
  catalogMenuItems: CatalogMenuItem[];
  catalogAddons: CatalogAddon[];
  band: { deliveryPctBps: number; tipPctBps: number };
  defaultTaxRateBps: number;
  quoteHistory: QuoteHistoryRow[];
}) {
  const [isPending, startTransition] = useTransition();

  const margin = useMemo(() => {
    const foodCostCents = items.reduce((sum, i) => sum + i.quantity * i.internalCostCents, 0);
    return calculateMargin(order.foodSubtotalCents, foodCostCents);
  }, [items, order.foodSubtotalCents]);

  const overageCents =
    order.budgetMode === "total" ? computeBudgetOverageCents(order.budgetAmountCents, order.grandTotalCents) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{order.customerName}</h1>
          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/admin/orders/${order.id}/beo`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Download BEO / Kitchen Sheet
          </a>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      {restrictions.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Allergies &amp; restrictions on this order</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {restrictions.map((r, i) => (
                <li key={i}>
                  <span className="font-medium">{RESTRICTION_LABELS[r.type] ?? r.type}:</span>{" "}
                  {r.value.replaceAll("_", " ")}
                  {r.affectedGuestCount ? ` (${r.affectedGuestCount} guests)` : ""}
                  {r.note ? ` — ${r.note}` : ""}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {overageCents > 0 && (
        <Alert variant="destructive">
          <AlertTitle>${(overageCents / 100).toFixed(2)} over the customer&apos;s stated budget</AlertTitle>
          <AlertDescription>
            This order used a fixed total budget of {centsToDollars(order.budgetAmountCents)}. The current quote
            exceeds that — the customer must re-approve before this can be scheduled.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: customer's submitted request, read-only */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date &amp; time</span>
                <span>
                  {order.eventDate} at {order.eventTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span>{order.guestCount}</span>
              </div>
              {order.companyName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span>{order.companyName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{order.customerPhone}</span>
              </div>
              {address && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-right">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.zip}
                  </span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span>
                  {centsToDollars(order.budgetAmountCents)} ({order.budgetMode === "per_person" ? "per person" : "total"})
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Price per person</span>
                <span>{centsToDollars(order.pricePerPersonCents)}</span>
              </div>
            </CardContent>
          </Card>

          {quoteHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quote history</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {quoteHistory.map((q) => (
                  <div key={q.id} className="flex items-center justify-between">
                    <a href={`/quote/${q.id}`} target="_blank" rel="noreferrer" className="hover:underline">
                      v{q.version}
                    </a>
                    <span className="text-muted-foreground">{centsToDollars(q.grandTotalCents)}</span>
                    <Badge variant="outline" className="capitalize">
                      {q.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: editable quote */}
        <div className="flex flex-col gap-4">
          <ItemsEditor orderId={order.id} items={items} catalogMenuItems={catalogMenuItems} />
          <AddonsEditor orderId={order.id} addons={addons} catalogAddons={catalogAddons} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Margin (admin only)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Food cost</div>
                <div className="font-medium">{centsToDollars(margin.foodCostCents)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Gross margin</div>
                <div className="font-medium">{centsToDollars(margin.grossMarginCents)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Margin %</div>
                <div className="font-medium">{(margin.grossMarginPct * 100).toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>

          <QuoteControls
            order={order}
            band={band}
            defaultTaxRateBps={defaultTaxRateBps}
            isPending={isPending}
            startTransition={startTransition}
            onToast={(msg, isError) => (isError ? toast.error(msg) : toast.success(msg))}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, type TransitionStartFunction } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateOrderOverrides, updateOrderNotes, sendRevisedQuote } from "../actions";
import type { OrderForWorkspace } from "./workspace";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function bpsToPercentString(bps: number | null | undefined) {
  return bps === null || bps === undefined ? "" : (bps / 100).toString();
}

function percentStringToBps(value: string): number | null {
  if (value.trim() === "") return null;
  return Math.round(Number(value) * 100);
}

interface FormValues {
  deliveryPct: string;
  tipPct: string;
  taxPct: string;
  discountDollars: string;
  surchargeDollars: string;
  reason: string;
  internalNotes: string;
  customerNotes: string;
}

export function QuoteControls({
  order,
  band,
  defaultTaxRateBps,
  isPending,
  startTransition,
  onToast,
}: {
  order: OrderForWorkspace;
  band: { deliveryPctBps: number; tipPctBps: number };
  defaultTaxRateBps: number;
  isPending: boolean;
  startTransition: TransitionStartFunction;
  onToast: (message: string, isError?: boolean) => void;
}) {
  const [lastSentVersion, setLastSentVersion] = useState<number | null>(null);
  const { register, getValues } = useForm<FormValues>({
    defaultValues: {
      deliveryPct: bpsToPercentString(order.deliveryPctOverrideBps),
      tipPct: bpsToPercentString(order.tipPctOverrideBps),
      taxPct: bpsToPercentString(order.taxRateOverrideBps),
      discountDollars: order.discountCents ? (order.discountCents / 100).toString() : "",
      surchargeDollars: order.surchargeCents ? (order.surchargeCents / 100).toString() : "",
      reason: order.discountSurchargeReason ?? "",
      internalNotes: order.internalNotes ?? "",
      customerNotes: order.customerNotes ?? "",
    },
  });

  async function saveAll() {
    const v = getValues();
    const discountCents = v.discountDollars.trim() ? Math.round(Number(v.discountDollars) * 100) : 0;
    const surchargeCents = v.surchargeDollars.trim() ? Math.round(Number(v.surchargeDollars) * 100) : 0;

    if ((discountCents > 0 || surchargeCents > 0) && !v.reason.trim()) {
      onToast("A reason is required for a discount or surcharge.", true);
      throw new Error("validation");
    }

    await updateOrderOverrides(order.id, {
      deliveryPctOverrideBps: percentStringToBps(v.deliveryPct),
      tipPctOverrideBps: percentStringToBps(v.tipPct),
      taxRateOverrideBps: percentStringToBps(v.taxPct),
      discountCents,
      surchargeCents,
      discountSurchargeReason: v.reason.trim() || null,
    });
    await updateOrderNotes(order.id, { internalNotes: v.internalNotes, customerNotes: v.customerNotes });
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveAll();
        onToast("Saved.");
      } catch {
        // validation error already toasted, or a real failure
      }
    });
  }

  function handleSendQuote() {
    startTransition(async () => {
      try {
        await saveAll();
        const result = await sendRevisedQuote(order.id);
        setLastSentVersion(result.version);
        onToast(`Quote v${result.version} sent.`);
      } catch {
        onToast("Failed to send the quote.", true);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fees, discounts &amp; notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deliveryPct">Delivery %</Label>
            <Input id="deliveryPct" placeholder={`${(band.deliveryPctBps / 100).toFixed(2)} default`} {...register("deliveryPct")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipPct">Gratuity %</Label>
            <Input id="tipPct" placeholder={`${(band.tipPctBps / 100).toFixed(2)} default`} {...register("tipPct")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="taxPct">Tax %</Label>
            <Input id="taxPct" placeholder={`${(defaultTaxRateBps / 100).toFixed(2)} default`} {...register("taxPct")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discountDollars">Discount ($)</Label>
            <Input id="discountDollars" type="number" min={0} step="0.01" {...register("discountDollars")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="surchargeDollars">Surcharge ($)</Label>
            <Input id="surchargeDollars" type="number" min={0} step="0.01" {...register("surchargeDollars")} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason">Reason (required if discount/surcharge is set)</Label>
          <Input id="reason" {...register("reason")} />
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="internalNotes">Internal notes (never shown to customer)</Label>
          <Textarea id="internalNotes" rows={2} {...register("internalNotes")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customerNotes">Customer-facing notes</Label>
          <Textarea id="customerNotes" rows={2} {...register("customerNotes")} />
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Grand total</span>
          <span>{centsToDollars(order.grandTotalCents)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={handleSave}>
            Save
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSendQuote}>
            Send revised quote
          </Button>
        </div>
        {lastSentVersion !== null && (
          <p className="text-xs text-muted-foreground">Quote v{lastSentVersion} sent to the customer.</p>
        )}
      </CardContent>
    </Card>
  );
}

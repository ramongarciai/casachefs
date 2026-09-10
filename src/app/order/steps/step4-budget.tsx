"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getQuoteAction } from "../actions";
import type { WizardDraft } from "../types";
import type { DietRestriction } from "@/lib/validations/order-wizard";

export function Step4Budget({
  draft,
  update,
  next,
  back,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  next: () => void;
  back: () => void;
}) {
  const [mode, setMode] = useState<"per_person" | "total">(draft.budgetMode ?? "per_person");
  const [amount, setAmount] = useState(draft.budgetAmountCents ? (draft.budgetAmountCents / 100).toFixed(2) : "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit() {
    const amountCents = Math.round(Number(amount) * 100);
    if (!amountCents || amountCents <= 0) {
      setError("Enter a budget amount.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const quote = await getQuoteAction({
        orderType: draft.orderType!,
        guestCount: draft.guestCount!,
        budgetMode: mode,
        budgetAmountCents: amountCents,
        excludedAllergens: Object.keys(draft.allergens),
        requiredDiets: Object.keys(draft.diets) as DietRestriction[],
        lowSpice: draft.lowSpiceGuestCount !== undefined,
      });
      update({ budgetMode: mode, budgetAmountCents: amountCents, quote });
      next();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">What&apos;s your budget?</h1>
        <p className="text-muted-foreground">We&apos;ll put together options that fit.</p>
      </div>

      <RadioGroup value={mode} onValueChange={(v) => v && setMode(v as "per_person" | "total")} className="gap-3">
        <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
          <RadioGroupItem value="per_person" className="mt-0.5" />
          <div>
            <div className="font-medium">Per person</div>
            <div className="text-sm text-muted-foreground">
              Delivery and gratuity are added on top of this number.
            </div>
          </div>
        </label>
        <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
          <RadioGroupItem value="total" className="mt-0.5" />
          <div>
            <div className="font-medium">Total budget</div>
            <div className="text-sm text-muted-foreground">
              Delivery and gratuity are included in this amount.
            </div>
          </div>
        </label>
      </RadioGroup>

      <div className="flex flex-col gap-1.5 max-w-xs">
        <Label htmlFor="budgetAmount">{mode === "per_person" ? "Price per person" : "Total budget"}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="budgetAmount"
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-6"
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={back} disabled={isPending}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isPending}>
          {isPending ? "Checking…" : "See options"}
        </Button>
      </div>
    </div>
  );
}

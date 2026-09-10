"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { step6Schema, submitOrderSchema } from "@/lib/validations/order-wizard";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { submitOrderAction } from "../actions";
import type { WizardDraft } from "../types";
import type { GetQuoteResult } from "../actions";

type FormValues = z.infer<typeof step6Schema>;

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function Step6Contact({
  draft,
  update,
  back,
  onSubmitted,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  back: () => void;
  onSubmitted: (orderId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const quote = draft.quote as Extract<GetQuoteResult, { status: "ok" }>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(step6Schema),
    defaultValues: draft.contact,
  });

  function onSubmit(contact: FormValues) {
    update({ contact });

    const payload = {
      orderType: draft.orderType!,
      event: {
        eventDate: draft.eventDate!,
        eventTime: draft.eventTime!,
        guestCount: draft.guestCount!,
        address: draft.address,
      },
      restrictions: {
        allergens: draft.allergens,
        diets: draft.diets,
        lowSpiceGuestCount: draft.lowSpiceGuestCount,
        otherNote: draft.otherNote,
      },
      budget: {
        budgetMode: draft.budgetMode!,
        budgetAmountCents: draft.budgetAmountCents!,
      },
      selectedItemIds: draft.selectedItemIds,
      selectedPackageId: draft.selectedPackageId,
      contact,
    };

    const parsed = submitOrderSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Something's missing — please check the previous steps.");
      return;
    }

    startTransition(async () => {
      const result = await submitOrderAction(parsed.data);
      if (result.status === "ok" && result.orderId) {
        onSubmitted(result.orderId);
      } else {
        toast.error("We couldn't submit your request. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Almost done</h1>
        <p className="text-muted-foreground">Tell us how to reach you.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company (optional)</Label>
            <Input id="companyName" {...register("companyName")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={back} disabled={isPending}>
              Back
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Your request</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="rounded bg-muted p-2 text-xs font-medium">
              Preliminary request — not a confirmed order.
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per person</span>
              <span>{centsToDollars(quote.pricePerPersonCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Food subtotal</span>
              <span>{centsToDollars(quote.foodSubtotalCents)}</span>
            </div>
            {quote.addonsSubtotalCents > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add-ons</span>
                <span>{centsToDollars(quote.addonsSubtotalCents)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{centsToDollars(quote.deliveryFeeCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gratuity</span>
              <span>{centsToDollars(quote.tipCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{centsToDollars(quote.taxCents)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Grand total</span>
              <span>{centsToDollars(quote.grandTotalCents)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

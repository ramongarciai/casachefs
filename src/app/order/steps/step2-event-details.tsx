"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2Schema } from "@/lib/validations/order-wizard";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { WizardDraft } from "../types";
import type { SavedAddress } from "../wizard-client";

type FormValues = z.input<typeof step2Schema>;

function formatAddress(a: SavedAddress) {
  return `${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city}, ${a.state} ${a.zip}`;
}

export function Step2EventDetails({
  draft,
  update,
  next,
  back,
  minimums,
  savedAddresses,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  next: () => void;
  back: () => void;
  minimums: { minGuests: number; minLeadDays: number; deliveryRadiusMiles: number };
  savedAddresses: SavedAddress[];
}) {
  const hasSavedAddresses = savedAddresses.length > 0;
  // Never silently reuse a saved address — the customer must make an
  // explicit choice before the address form appears.
  const [addressChoice, setAddressChoice] = useState<string | null>(hasSavedAddresses ? null : "new");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues, unknown, z.output<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      eventDate: draft.eventDate ?? "",
      eventTime: draft.eventTime ?? "",
      guestCount: draft.guestCount,
      address: draft.address,
    },
  });

  function chooseAddress(choiceId: string) {
    setAddressChoice(choiceId);
    if (choiceId === "new") {
      setValue("address", { line1: "", line2: "", city: "", state: "TX", zip: "" });
      return;
    }
    const saved = savedAddresses.find((a) => a.id === choiceId);
    if (saved) {
      setValue("address", {
        line1: saved.line1,
        line2: saved.line2 ?? "",
        city: saved.city,
        state: saved.state,
        zip: saved.zip,
      });
    }
  }

  function onSubmit(data: z.output<typeof step2Schema>) {
    const earliestDate = new Date();
    earliestDate.setDate(earliestDate.getDate() + minimums.minLeadDays);
    const chosenDate = new Date(data.eventDate);
    const errorsFound: string[] = [];

    if (data.guestCount < minimums.minGuests) {
      errorsFound.push(`Minimum ${minimums.minGuests} guests for this service.`);
    }
    if (chosenDate < earliestDate) {
      errorsFound.push(`We need at least ${minimums.minLeadDays} days' notice.`);
    }
    if (errorsFound.length) {
      alert(errorsFound.join(" "));
      return;
    }

    update({
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      guestCount: data.guestCount,
      address: data.address,
    });
    next();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Event details</h1>
        <p className="text-muted-foreground">
          Minimum {minimums.minGuests} guests, {minimums.minLeadDays} days&apos; notice. We deliver within about{" "}
          {minimums.deliveryRadiusMiles} miles of Magnolia / The Woodlands.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eventDate">Date</Label>
          <Input id="eventDate" type="date" {...register("eventDate")} />
          {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eventTime">Time</Label>
          <Input id="eventTime" type="time" {...register("eventTime")} />
          {errors.eventTime && <p className="text-xs text-destructive">{errors.eventTime.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="guestCount">Guest count</Label>
          <Input id="guestCount" type="number" min={1} {...register("guestCount")} />
          {errors.guestCount && <p className="text-xs text-destructive">{errors.guestCount.message}</p>}
        </div>
      </div>

      {hasSavedAddresses && (
        <div className="flex flex-col gap-2">
          <Label>Is this catering at the same address as last time, or a new address?</Label>
          <RadioGroup value={addressChoice ?? undefined} onValueChange={(v) => v && chooseAddress(v)}>
            {savedAddresses.map((a, i) => (
              <label key={a.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm cursor-pointer">
                <RadioGroupItem value={a.id} className="mt-0.5" />
                <span>
                  {i === 0 && <span className="mr-1 font-medium">Most recent —</span>}
                  {formatAddress(a)}
                </span>
              </label>
            ))}
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm cursor-pointer">
              <RadioGroupItem value="new" className="mt-0.5" />
              <span>Enter a new address</span>
            </label>
          </RadioGroup>
        </div>
      )}

      {addressChoice && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="line1">Street address</Label>
            <Input id="line1" {...register("address.line1")} />
            {errors.address?.line1 && <p className="text-xs text-destructive">{errors.address.line1.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="line2">Suite / unit (optional)</Label>
            <Input id="line2" {...register("address.line2")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("address.city")} />
            {errors.address?.city && <p className="text-xs text-destructive">{errors.address.city.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" maxLength={2} {...register("address.state")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" {...register("address.zip")} />
              {errors.address?.zip && <p className="text-xs text-destructive">{errors.address.zip.message}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={back}>
          Back
        </Button>
        <Button type="submit" disabled={!addressChoice}>
          Continue
        </Button>
      </div>
    </form>
  );
}

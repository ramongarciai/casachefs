"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2Schema } from "@/lib/validations/order-wizard";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardDraft } from "../types";

type FormValues = z.input<typeof step2Schema>;

export function Step2EventDetails({
  draft,
  update,
  next,
  back,
  minimums,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  next: () => void;
  back: () => void;
  minimums: { minGuests: number; minLeadDays: number; deliveryRadiusMiles: number };
}) {
  const {
    register,
    handleSubmit,
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
        <h1 className="text-2xl font-semibold tracking-tight">Event details</h1>
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

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={back}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}

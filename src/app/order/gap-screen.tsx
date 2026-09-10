"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { callbackRequestSchema } from "@/lib/validations/order-wizard";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitCallbackAction } from "./actions";

type FormValues = z.infer<typeof callbackRequestSchema>;

export function GapScreen({ back }: { back: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(callbackRequestSchema) });

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      await submitCallbackAction(data);
      setDone(true);
    });
  }

  if (done) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Thanks — we&apos;ll be in touch</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Someone from our team will reach out shortly to talk through the details.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Let&apos;s talk</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          We&apos;d love to help — leave your info and someone from our team will follow up to find the right fit.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cb-name">Name</Label>
            <Input id="cb-name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cb-email">Email</Label>
            <Input id="cb-email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cb-phone">Phone (optional)</Label>
            <Input id="cb-phone" {...register("phone")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cb-note">Anything you&apos;d like us to know?</Label>
            <Textarea id="cb-note" rows={3} {...register("note")} />
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={back} disabled={isPending}>
              Back
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending…" : "Request a callback"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

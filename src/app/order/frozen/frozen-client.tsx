"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { frozenOrderSchema } from "@/lib/validations/frozen-order";
import { submitFrozenOrderAction } from "./actions";
import { ConfirmationScreen } from "../confirmation-screen";

interface Product {
  id: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string | null;
  publishedPriceCents: number;
  unit: string;
  minQuantity: number;
  leadTimeDays: number;
}

interface Contact {
  name: string;
  email: string;
  phone: string;
}

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function FrozenClient({
  products,
  initialContact,
  taxRateBps,
}: {
  products: Product[];
  initialContact?: Contact;
  taxRateBps: number;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [contact, setContact] = useState<Contact & { companyName: string }>({
    name: initialContact?.name ?? "",
    email: initialContact?.email ?? "",
    phone: initialContact?.phone ?? "",
    companyName: "",
  });
  const [isPending, startTransition] = useTransition();
  const [orderId, setOrderId] = useState<string | null>(null);

  const cart = products
    .map((p) => ({ product: p, quantity: quantities[p.id] ?? 0 }))
    .filter((line) => line.quantity > 0);

  const maxLeadTimeDays = cart.reduce((max, line) => Math.max(max, line.product.leadTimeDays), 0);
  const minPickupDate = addDaysIso(maxLeadTimeDays);

  const foodSubtotalCents = cart.reduce((sum, line) => sum + line.quantity * line.product.publishedPriceCents, 0);
  const estimatedTaxCents = Math.round((foodSubtotalCents * taxRateBps) / 10_000);
  const estimatedTotalCents = foodSubtotalCents + estimatedTaxCents;

  function setQuantity(productId: string, value: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, value) }));
  }

  const belowMinimum = cart.filter((line) => line.quantity < line.product.minQuantity);

  function onSubmit() {
    if (cart.length === 0) {
      toast.error("Add at least one item.");
      return;
    }
    if (belowMinimum.length > 0) {
      toast.error(`${belowMinimum[0].product.nameEn} needs at least ${belowMinimum[0].product.minQuantity} ${belowMinimum[0].product.unit}.`);
      return;
    }
    if (!pickupDate || pickupDate < minPickupDate) {
      toast.error(`Pickup date must be on or after ${minPickupDate}.`);
      return;
    }

    const payload = {
      items: cart.map((line) => ({ menuItemId: line.product.id, quantity: line.quantity })),
      pickupDate,
      pickupTime,
      contact,
    };

    const parsed = frozenOrderSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your info.");
      return;
    }

    startTransition(async () => {
      const result = await submitFrozenOrderAction(parsed.data);
      if (result.status === "ok" && result.orderId) {
        setOrderId(result.orderId);
      } else {
        toast.error(result.error ?? "We couldn't submit your order. Please try again.");
      }
    });
  }

  if (orderId) {
    return (
      <div className="mx-auto flex max-w-3xl flex-1 items-center justify-center px-6 py-16">
        <ConfirmationScreen orderId={orderId} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 pb-32">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Frozen Food</h1>
        <p className="text-muted-foreground">
          Made-to-order, sold by the pound or liter. Pickup only for now — no delivery.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="text-base">{p.nameEn}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p className="text-xs text-muted-foreground">{p.nameEs}</p>
              {p.descriptionEn && <p className="text-muted-foreground">{p.descriptionEn}</p>}
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {centsToDollars(p.publishedPriceCents)} / {p.unit}
                </span>
                <span className="text-xs text-muted-foreground">
                  min {p.minQuantity} {p.unit}, {p.leadTimeDays}d lead
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`qty-${p.id}`} className="text-xs">
                  Quantity ({p.unit})
                </Label>
                <Input
                  id={`qty-${p.id}`}
                  type="number"
                  min={0}
                  value={quantities[p.id] ?? 0}
                  onChange={(e) => setQuantity(p.id, Number(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">No frozen products available right now.</p>
        )}
      </div>

      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pickup details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              Earliest pickup for this order: {minPickupDate} ({maxLeadTimeDays} day lead time)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pickupDate">Pickup date</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  min={minPickupDate}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pickupTime">Pickup time</Label>
                <Input id="pickupTime" type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fname">Name</Label>
                <Input id="fname" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fcompany">Company (optional)</Label>
                <Input
                  id="fcompany"
                  value={contact.companyName}
                  onChange={(e) => setContact((c) => ({ ...c, companyName: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="femail">Email</Label>
                <Input
                  id="femail"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fphone">Phone</Label>
                <Input
                  id="fphone"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="text-sm">
            <div>
              Subtotal: <span className="font-medium">{centsToDollars(foodSubtotalCents)}</span>
            </div>
            <div className="text-xs text-muted-foreground">Est. total incl. tax: {centsToDollars(estimatedTotalCents)}</div>
          </div>
          <Button type="button" onClick={onSubmit} disabled={isPending || cart.length === 0}>
            {isPending ? "Submitting…" : "Submit order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

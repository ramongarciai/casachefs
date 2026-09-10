"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateOrderNotes } from "../actions";
import { OrderStatusSelect } from "./order-status-select";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export interface FrozenReviewItem {
  id: string;
  nameEn: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
}

export interface FrozenOrderForReview {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string | null;
  eventDate: string;
  eventTime: string;
  status: string;
  foodSubtotalCents: number;
  taxCents: number;
  grandTotalCents: number;
  customerNotes: string | null;
  internalNotes: string | null;
  driverNotes: string | null;
}

export function FrozenOrderReview({
  order,
  items,
}: {
  order: FrozenOrderForReview;
  items: FrozenReviewItem[];
}) {
  const [isPending, startTransition] = useTransition();

  function saveNotes(formData: FormData) {
    const internalNotes = String(formData.get("internalNotes") ?? "");
    const customerNotes = String(formData.get("customerNotes") ?? "");
    const driverNotes = String(formData.get("pickupNotes") ?? "");
    startTransition(async () => {
      try {
        await updateOrderNotes(order.id, { internalNotes, customerNotes, deliveryWindow: "", driverNotes });
        toast.success("Saved.");
      } catch {
        toast.error("Failed to save.");
      }
    });
  }

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
            Download packing sheet
          </a>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pickup order — frozen food</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup</span>
              <span>
                {order.eventDate} at {order.eventTime}
              </span>
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

            <Separator className="my-1" />

            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.nameEn} × {item.quantity} {item.unit}
                </span>
                <span>{centsToDollars(item.quantity * item.unitPriceCents)}</span>
              </div>
            ))}

            <Separator className="my-1" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{centsToDollars(order.foodSubtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{centsToDollars(order.taxCents)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{centsToDollars(order.grandTotalCents)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveNotes} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="internalNotes">Internal notes (never shown to customer)</Label>
                <Textarea id="internalNotes" name="internalNotes" rows={2} defaultValue={order.internalNotes ?? ""} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customerNotes">Customer-facing notes</Label>
                <Textarea id="customerNotes" name="customerNotes" rows={2} defaultValue={order.customerNotes ?? ""} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pickupNotes">Pickup notes</Label>
                <Textarea id="pickupNotes" name="pickupNotes" rows={2} defaultValue={order.driverNotes ?? ""} />
              </div>
              <Button type="submit" disabled={isPending} className="self-end">
                Save
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

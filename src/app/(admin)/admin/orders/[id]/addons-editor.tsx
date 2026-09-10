"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addOrderAddon, removeOrderAddon, updateOrderAddonQuantity } from "../actions";
import type { AddonLine, CatalogAddon } from "./workspace";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const UNIT_LABELS: Record<string, string> = {
  per_item: "/item",
  per_person: "/person",
  per_hour: "/hr",
  per_person_per_hour: "/person/hr",
  flat: " flat",
};

export function AddonsEditor({
  orderId,
  addons,
  catalogAddons,
}: {
  orderId: string;
  addons: AddonLine[];
  catalogAddons: CatalogAddon[];
}) {
  const [isPending, startTransition] = useTransition();
  const [addAddonId, setAddAddonId] = useState<string>("");
  const [addVariantId, setAddVariantId] = useState<string>("");
  const [addQuantity, setAddQuantity] = useState(1);

  const selectedCatalogAddon = catalogAddons.find((a) => a.id === addAddonId);

  function addAddon() {
    if (!addAddonId) return;
    startTransition(async () => {
      try {
        await addOrderAddon(orderId, {
          addonId: addAddonId,
          addonVariantId: addVariantId || undefined,
          quantity: addQuantity,
        });
        setAddAddonId("");
        setAddVariantId("");
        setAddQuantity(1);
      } catch {
        toast.error("Failed to add add-on.");
      }
    });
  }

  function removeAddon(id: string) {
    startTransition(async () => {
      try {
        await removeOrderAddon(id, orderId);
      } catch {
        toast.error("Failed to remove add-on.");
      }
    });
  }

  function updateQuantity(id: string, quantity: number) {
    startTransition(async () => {
      try {
        await updateOrderAddonQuantity(id, orderId, quantity);
      } catch {
        toast.error("Failed to update add-on.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event add-ons</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {addons.map((a) => (
          <div key={a.id} className="flex items-center gap-2 text-sm">
            <div className="flex-1">
              <div className="font-medium">
                {a.nameEn}
                {a.variantNameEn ? ` — ${a.variantNameEn}` : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                {centsToDollars(a.unitPriceCentsSnapshot)} × {a.quantity} ={" "}
                {centsToDollars(a.unitPriceCentsSnapshot * a.quantity)}
              </div>
            </div>
            <Input
              type="number"
              min={1}
              defaultValue={a.quantity}
              className="w-20"
              onBlur={(e) => {
                const q = Number(e.target.value);
                if (q > 0 && q !== a.quantity) updateQuantity(a.id, q);
              }}
            />
            <Button type="button" size="icon-sm" variant="outline" disabled={isPending} onClick={() => removeAddon(a.id)}>
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        {addons.length === 0 && <p className="text-xs text-muted-foreground">No add-ons yet.</p>}

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Select
            value={addAddonId}
            onValueChange={(v) => {
              setAddAddonId(v ?? "");
              setAddVariantId("");
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add from catalog…" />
            </SelectTrigger>
            <SelectContent>
              {catalogAddons.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nameEn} ({centsToDollars(a.unitPriceCents)}
                  {UNIT_LABELS[a.unit]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCatalogAddon && selectedCatalogAddon.variants.length > 0 && (
            <Select value={addVariantId} onValueChange={(v) => setAddVariantId(v ?? "")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Variant" />
              </SelectTrigger>
              <SelectContent>
                {selectedCatalogAddon.variants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Input
            type="number"
            min={1}
            value={addQuantity}
            onChange={(e) => setAddQuantity(Number(e.target.value) || 1)}
            className="w-20"
          />
          <Button type="button" size="sm" disabled={!addAddonId || isPending} onClick={addAddon}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

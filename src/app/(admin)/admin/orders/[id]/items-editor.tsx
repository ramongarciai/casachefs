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
import { replaceOrderItems } from "../actions";
import type { Item, CatalogMenuItem } from "./workspace";

export function ItemsEditor({
  orderId,
  items,
  catalogMenuItems,
}: {
  orderId: string;
  items: Item[];
  catalogMenuItems: CatalogMenuItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [addItemId, setAddItemId] = useState<string>("");
  const [addQuantity, setAddQuantity] = useState(1);

  function save(next: { menuItemId: string; quantity: number }[]) {
    startTransition(async () => {
      try {
        await replaceOrderItems(orderId, next);
      } catch {
        toast.error("Failed to update items.");
      }
    });
  }

  function updateQuantity(itemId: string, quantity: number) {
    save(items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.id === itemId ? quantity : i.quantity })));
  }

  function removeItem(itemId: string) {
    save(items.filter((i) => i.id !== itemId).map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })));
  }

  function addItem() {
    if (!addItemId) return;
    save([
      ...items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      { menuItemId: addItemId, quantity: addQuantity },
    ]);
    setAddItemId("");
    setAddQuantity(1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Items</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <div className="flex-1">
              <div className="font-medium">{item.nameEn}</div>
              <div className="text-xs capitalize text-muted-foreground">{item.category.replaceAll("_", " ")}</div>
            </div>
            <Input
              type="number"
              min={0}
              defaultValue={item.quantity}
              className="w-20"
              onBlur={(e) => {
                const q = Number(e.target.value);
                if (q !== item.quantity) updateQuantity(item.id, q);
              }}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={isPending}
              onClick={() => removeItem(item.id)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground">No items yet.</p>}

        <div className="flex items-center gap-2 border-t pt-3">
          <Select value={addItemId} onValueChange={(v) => setAddItemId(v ?? "")}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add a menu item…" />
            </SelectTrigger>
            <SelectContent>
              {catalogMenuItems.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            value={addQuantity}
            onChange={(e) => setAddQuantity(Number(e.target.value) || 1)}
            className="w-20"
          />
          <Button type="button" size="sm" disabled={!addItemId || isPending} onClick={addItem}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

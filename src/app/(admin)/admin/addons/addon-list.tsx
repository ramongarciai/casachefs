"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkSetAddonActive } from "./actions";
import { ADDON_CATEGORIES } from "@/lib/validations/addon";

const CATEGORY_LABELS: Record<string, string> = {
  staff: "Staff",
  furniture: "Furniture",
  linens: "Linens",
  tableware: "Tableware",
  decor: "Decor",
  beverages: "Beverages",
};

const UNIT_LABELS: Record<string, string> = {
  per_item: "per item",
  per_person: "per person",
  per_hour: "per hour",
  per_person_per_hour: "per person/hr",
  flat: "flat",
};

interface Row {
  id: string;
  category: string;
  nameEn: string;
  nameEs: string;
  unit: string;
  unitPriceCents: number;
  active: boolean;
  variantCount: number;
}

export function AddonList({ addons }: { addons: Row[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulk(active: boolean) {
    startTransition(async () => {
      await bulkSetAddonActive(Array.from(selected), active);
      toast.success(active ? "Activated." : "Deactivated.");
      setSelected(new Set());
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div />
        <Button render={<Link href="/admin/addons/new" />}>New add-on</Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => runBulk(true)}>
            Activate
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => runBulk(false)}>
            Deactivate
          </Button>
        </div>
      )}

      {ADDON_CATEGORIES.map((category) => {
        const rows = addons.filter((a) => a.category === category);
        if (rows.length === 0) return null;
        return (
          <div key={category} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">{CATEGORY_LABELS[category]}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(addon.id)} onCheckedChange={() => toggle(addon.id)} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/addons/${addon.id}`} className="font-medium hover:underline">
                        {addon.nameEn}
                      </Link>
                      <div className="text-xs text-muted-foreground">{addon.nameEs}</div>
                    </TableCell>
                    <TableCell>
                      ${(addon.unitPriceCents / 100).toFixed(2)} {UNIT_LABELS[addon.unit]}
                    </TableCell>
                    <TableCell>{addon.variantCount || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={addon.active ? "default" : "outline"}>
                        {addon.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkSetActive, bulkAssignBand, duplicateMenuItem } from "./actions";

interface Row {
  id: string;
  category: string;
  nameEn: string;
  nameEs: string;
  active: boolean;
  isSample: boolean;
  bandCodes: string[];
  thumbUrl: string | null;
}

interface Band {
  code: string;
  label: string;
}

export function MenuList({ items, bands }: { items: Row[]; bands: Band[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bandToAssign, setBandToAssign] = useState<string>(bands[0]?.code ?? "");
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  const filtered = items.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || item.nameEn.toLowerCase().includes(q) || item.nameEs.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.id)),
    );
  }

  function runBulk(fn: () => Promise<void>, label: string) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(label);
        setSelected(new Set());
      } catch {
        toast.error("Bulk action failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/menu/new" />}>
          New item
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              runBulk(() => bulkSetActive(Array.from(selected), true), "Activated.")
            }
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              runBulk(() => bulkSetActive(Array.from(selected), false), "Deactivated.")
            }
          >
            Deactivate
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              runBulk(async () => {
                for (const id of selected) await duplicateMenuItem(id);
              }, "Duplicated.")
            }
          >
            Duplicate
          </Button>
          <div className="flex items-center gap-1.5">
            <Select value={bandToAssign} onValueChange={(v) => setBandToAssign(v ?? "")}>
              <SelectTrigger className="w-44" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bands.map((b) => (
                  <SelectItem key={b.code} value={b.code}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending || !bandToAssign}
              onClick={() =>
                runBulk(
                  () => bulkAssignBand(Array.from(selected), bandToAssign),
                  "Band assigned.",
                )
              }
            >
              Assign to band
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={filtered.length > 0 && selected.size === filtered.length}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Bands</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggle(item.id)} />
              </TableCell>
              <TableCell>
                {item.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbUrl} alt="" className="size-10 rounded object-cover" />
                ) : (
                  <div className="size-10 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell>
                <Link href={`/admin/menu/${item.id}`} className="font-medium hover:underline">
                  {item.nameEn}
                </Link>
                <div className="text-xs text-muted-foreground">{item.nameEs}</div>
              </TableCell>
              <TableCell className="capitalize">{item.category.replaceAll("_", " ")}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.bandCodes.map((code) => (
                    <Badge key={code} variant="secondary">
                      {code}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  <Badge variant={item.active ? "default" : "outline"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                  {item.isSample && <Badge variant="secondary">Sample</Badge>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WizardDraft } from "../types";
import type { GetQuoteResult, QuotePackage } from "../actions";
import type { PublicMenuItem } from "@/lib/pricing/dto";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function ItemRow({
  item,
  alternatives,
  onSwap,
}: {
  item: PublicMenuItem;
  alternatives: PublicMenuItem[];
  onSwap: (newItemId: string) => void;
}) {
  const [swapping, setSwapping] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{item.nameEn}</div>
          <div className="text-xs text-muted-foreground">{item.nameEs}</div>
          {item.descriptionEn && <p className="mt-1 text-sm text-muted-foreground">{item.descriptionEn}</p>}
          <div className="mt-1 flex flex-wrap gap-1">
            {item.dietary.vegan && <Badge variant="secondary">Vegan</Badge>}
            {!item.dietary.vegan && item.dietary.vegetarian && <Badge variant="secondary">Vegetarian</Badge>}
            {item.dietary.glutenFree && <Badge variant="secondary">Gluten-free</Badge>}
            {item.spiceLevel !== "none" && <Badge variant="outline">{item.spiceLevel} spice</Badge>}
          </div>
        </div>
        {alternatives.length > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={() => setSwapping((s) => !s)}>
            Swap
          </Button>
        )}
      </div>
      {swapping && (
        <div className="flex flex-col gap-1 border-t pt-2">
          {alternatives.map((alt) => (
            <button
              key={alt.id}
              type="button"
              onClick={() => {
                onSwap(alt.id);
                setSwapping(false);
              }}
              className="rounded px-2 py-1 text-left text-sm hover:bg-muted"
            >
              {alt.nameEn} <span className="text-muted-foreground">/ {alt.nameEs}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Step5Options({
  draft,
  update,
  next,
  back,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  next: () => void;
  back: () => void;
}) {
  const quote = draft.quote as Extract<GetQuoteResult, { status: "ok" }>;
  const itemsById = new Map(quote.items.map((i) => [i.id, i]));

  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(
    draft.selectedPackageId ?? quote.packages[0]?.id,
  );
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    draft.selectedItemIds.length ? draft.selectedItemIds : (quote.packages[0]?.itemIds ?? []),
  );

  function choosePackage(pkg: QuotePackage) {
    setSelectedPackageId(pkg.id);
    setSelectedItemIds(pkg.itemIds);
  }

  function swapItem(oldItemId: string, newItemId: string) {
    setSelectedItemIds((prev) => prev.map((id) => (id === oldItemId ? newItemId : id)));
  }

  function onContinue() {
    update({ selectedPackageId, selectedItemIds });
    next();
  }

  const selectedItems = selectedItemIds.map((id) => itemsById.get(id)).filter((i): i is PublicMenuItem => !!i);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Choose your menu</h1>
        <p className="text-muted-foreground">Pick a package, then swap anything you&apos;d like to change.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quote.packages.map((pkg) => (
          <Card
            key={pkg.id}
            role="button"
            tabIndex={0}
            onClick={() => choosePackage(pkg)}
            className={`cursor-pointer transition-colors hover:border-primary ${
              selectedPackageId === pkg.id ? "border-primary" : ""
            }`}
          >
            <CardHeader>
              <CardTitle>{pkg.nameEn}</CardTitle>
              <CardDescription>{pkg.descriptionEn}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {quote.packages.length === 0 && (
        <p className="text-sm text-muted-foreground">
          We don&apos;t have a curated package for these restrictions yet — browse items below.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Your items</h2>
        {selectedItems.map((item) => {
          const alternatives = quote.items.filter(
            (candidate) => candidate.category === item.category && !selectedItemIds.includes(candidate.id),
          );
          return (
            <ItemRow key={item.id} item={item} alternatives={alternatives} onSwap={(newId) => swapItem(item.id, newId)} />
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <span className="font-semibold">{centsToDollars(quote.pricePerPersonCents)}</span>
            <span className="text-sm text-muted-foreground"> per person</span>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
            <Button type="button" onClick={onContinue} disabled={selectedItems.length === 0}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ALLERGENS, DIET_RESTRICTIONS, type AllergenValue, type DietRestriction } from "@/lib/validations/order-wizard";
import type { WizardDraft } from "../types";

const ALLERGEN_LABELS: Record<AllergenValue, string> = {
  peanut: "Peanut",
  tree_nut: "Tree nut",
  dairy: "Dairy",
  egg: "Egg",
  shellfish: "Shellfish",
  fish: "Fish",
  soy: "Soy",
  wheat_gluten: "Wheat / gluten",
  sesame: "Sesame",
};

const DIET_LABELS: Record<DietRestriction, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  kosher: "Kosher",
  halal: "Halal",
  porkFree: "Pork-free",
};

function RestrictionChip({
  label,
  selected,
  count,
  onToggle,
  onCountChange,
}: {
  label: string;
  selected: boolean;
  count: number;
  onToggle: () => void;
  onCountChange: (n: number) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <button type="button" onClick={onToggle} className="font-medium">
        {label}
      </button>
      {selected && (
        <>
          <span className="text-muted-foreground">guests:</span>
          <Input
            type="number"
            min={1}
            value={count}
            onChange={(e) => onCountChange(Number(e.target.value) || 1)}
            className="h-6 w-14 px-1.5 text-xs"
          />
        </>
      )}
    </div>
  );
}

export function Step3Restrictions({
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
  const [allergens, setAllergens] = useState<Record<string, number>>(draft.allergens);
  const [diets, setDiets] = useState<Partial<Record<DietRestriction, number>>>(draft.diets);
  const [lowSpice, setLowSpice] = useState<number | undefined>(draft.lowSpiceGuestCount);
  const [otherNote, setOtherNote] = useState(draft.otherNote ?? "");

  function toggleAllergen(a: AllergenValue) {
    setAllergens((prev) => {
      const next = { ...prev };
      if (a in next) delete next[a];
      else next[a] = 1;
      return next;
    });
  }

  function toggleDiet(d: DietRestriction) {
    setDiets((prev) => {
      const next = { ...prev };
      if (d in next) delete next[d];
      else next[d] = 1;
      return next;
    });
  }

  function onSubmit() {
    update({ allergens, diets, lowSpiceGuestCount: lowSpice, otherNote });
    next();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Allergies &amp; restrictions</h1>
        <p className="text-muted-foreground">This tells us what to leave out and drives our kitchen sheet.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Allergens</Label>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <RestrictionChip
              key={a}
              label={ALLERGEN_LABELS[a]}
              selected={a in allergens}
              count={allergens[a] ?? 1}
              onToggle={() => toggleAllergen(a)}
              onCountChange={(n) => setAllergens((prev) => ({ ...prev, [a]: n }))}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Diets</Label>
        <div className="flex flex-wrap gap-2">
          {DIET_RESTRICTIONS.map((d) => (
            <RestrictionChip
              key={d}
              label={DIET_LABELS[d]}
              selected={d in diets}
              count={diets[d] ?? 1}
              onToggle={() => toggleDiet(d)}
              onCountChange={(n) => setDiets((prev) => ({ ...prev, [d]: n }))}
            />
          ))}
          <RestrictionChip
            label="Low spice"
            selected={lowSpice !== undefined}
            count={lowSpice ?? 1}
            onToggle={() => setLowSpice((prev) => (prev === undefined ? 1 : undefined))}
            onCountChange={(n) => setLowSpice(n)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otherNote">Anything else we should know?</Label>
        <Textarea id="otherNote" value={otherNote} onChange={(e) => setOtherNote(e.target.value)} rows={3} />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={back}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit}>
          Continue
        </Button>
      </div>
    </div>
  );
}

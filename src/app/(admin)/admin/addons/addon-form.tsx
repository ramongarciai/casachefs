"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ADDON_CATEGORIES,
  ADDON_UNITS,
  addonSchema,
  type AddonInput,
  type AddonFormInput,
} from "@/lib/validations/addon";
import { createAddon, updateAddon } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

const CATEGORY_LABELS: Record<(typeof ADDON_CATEGORIES)[number], string> = {
  staff: "Staff",
  furniture: "Furniture",
  linens: "Linens",
  tableware: "Tableware",
  decor: "Decor",
  beverages: "Beverages",
};

const UNIT_LABELS: Record<(typeof ADDON_UNITS)[number], string> = {
  per_item: "per item",
  per_person: "per person",
  per_hour: "per hour",
  per_person_per_hour: "per person per hour",
  flat: "flat fee",
};

export function AddonForm({
  mode,
  addonId,
  defaultValues,
}: {
  mode: "create" | "edit";
  addonId?: string;
  defaultValues: Partial<AddonInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddonFormInput, unknown, AddonInput>({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      category: "staff",
      unit: "per_item",
      unitPriceCents: 0,
      active: true,
      variants: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  function onSubmit(data: AddonInput) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          const id = await createAddon(data);
          toast.success("Add-on created.");
          router.push(`/admin/addons/${id}`);
        } else if (addonId) {
          await updateAddon(addonId, data);
          toast.success("Saved.");
          router.refresh();
        }
      } catch {
        toast.error("Something went wrong saving this add-on.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDON_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="unit">Billing unit</Label>
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDON_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {UNIT_LABELS[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nameEn">Name (English)</Label>
            <Input id="nameEn" {...register("nameEn")} />
            {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nameEs">Nombre (Español)</Label>
            <Input id="nameEs" {...register("nameEs")} />
            {errors.nameEs && <p className="text-xs text-destructive">{errors.nameEs.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="unitPriceCents">Unit price (cents)</Label>
            <Input id="unitPriceCents" type="number" min={0} {...register("unitPriceCents")} />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Controller
              control={control}
              name="active"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
            Active
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            e.g. color options for linens/chair covers — leave empty if this add-on has none.
          </p>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input placeholder="English (e.g. Burgundy)" {...register(`variants.${index}.nameEn`)} />
              <Input placeholder="Español (e.g. Vino)" {...register(`variants.${index}.nameEs`)} />
              <Button type="button" size="icon-sm" variant="outline" onClick={() => remove(index)}>
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="self-start"
            onClick={() => append({ nameEn: "", nameEs: "" })}
          >
            Add variant
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {mode === "create" ? "Create add-on" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

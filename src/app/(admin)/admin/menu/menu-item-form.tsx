"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ALLERGENS,
  BAND_CODES,
  MENU_CATEGORIES,
  SPICE_LEVELS,
  menuItemSchema,
  type MenuItemInput,
  type MenuItemFormInput,
} from "@/lib/validations/menu-item";
import { createMenuItem, updateMenuItem } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_LABELS: Record<(typeof MENU_CATEGORIES)[number], string> = {
  entrada: "Entrada",
  plato_fuerte: "Plato fuerte",
  ensalada: "Ensalada",
  canape: "Canapé",
  entremes: "Entremés",
  tabla_charcuteria: "Tabla de charcutería",
  postre: "Postre",
  bebida: "Bebida",
  guarnicion: "Guarnición",
  frozen: "Frozen (lb / L)",
};

const ALLERGEN_LABELS: Record<(typeof ALLERGENS)[number], string> = {
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

const DIETARY_TOGGLES = [
  ["glutenFree", "Gluten-free"],
  ["kosher", "Kosher"],
  ["halal", "Halal"],
  ["vegetarian", "Vegetarian"],
  ["vegan", "Vegan"],
  ["dairyFree", "Dairy-free"],
  ["nutFree", "Nut-free"],
  ["porkFree", "Pork-free"],
] as const;

interface BandOption {
  code: string;
  label: string;
  serviceLine: string;
}

export function MenuItemForm({
  mode,
  itemId,
  defaultValues,
  bands,
}: {
  mode: "create" | "edit";
  itemId?: string;
  defaultValues: Partial<MenuItemInput>;
  bands: BandOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MenuItemFormInput, unknown, MenuItemInput>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      category: "entrada",
      spiceLevel: "none",
      active: true,
      minQuantity: 1,
      leadTimeDays: 0,
      internalCostCents: 0,
      allergens: [],
      bandCodes: [],
      ...defaultValues,
    },
  });

  const category = useWatch({ control, name: "category" });
  const isFrozen = category === "frozen";

  function onSubmit(data: MenuItemInput) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          const id = await createMenuItem(data);
          toast.success("Item created — now add photos below.");
          router.push(`/admin/menu/${id}`);
        } else if (itemId) {
          await updateMenuItem(itemId, data);
          toast.success("Saved.");
          router.refresh();
        }
      } catch {
        toast.error("Something went wrong saving this item.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
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
                    {MENU_CATEGORIES.map((c) => (
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
            <Label htmlFor="descriptionEn">Description (English)</Label>
            <Textarea id="descriptionEn" rows={3} {...register("descriptionEn")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descriptionEs">Descripción (Español)</Label>
            <Textarea id="descriptionEs" rows={3} {...register("descriptionEs")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dietary & spice</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 max-w-xs">
            <Label htmlFor="spiceLevel">Spice level</Label>
            <Controller
              control={control}
              name="spiceLevel"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="spiceLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPICE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} className="capitalize">
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DIETARY_TOGGLES.map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 text-sm">
                <Controller
                  control={control}
                  name={field}
                  render={({ field: f }) => (
                    <Checkbox checked={f.value} onCheckedChange={f.onChange} />
                  )}
                />
                {label}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Allergens (declared)</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Controller
                control={control}
                name="allergens"
                render={({ field }) => (
                  <>
                    {ALLERGENS.map((allergen) => {
                      const checked = field.value?.includes(allergen);
                      return (
                        <label key={allergen} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              const set = new Set(field.value ?? []);
                              if (next) set.add(allergen);
                              else set.delete(allergen);
                              field.onChange(Array.from(set));
                            }}
                          />
                          {ALLERGEN_LABELS[allergen]}
                        </label>
                      );
                    })}
                  </>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost & pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="internalCostCents">Internal cost per serving (cents)</Label>
            <Input
              id="internalCostCents"
              type="number"
              min={0}
              {...register("internalCostCents")}
            />
            <p className="text-xs text-muted-foreground">Admin-only. Never shown to customers.</p>
          </div>

          {isFrozen ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="publishedPriceCents">Published price (cents)</Label>
                <Input
                  id="publishedPriceCents"
                  type="number"
                  min={0}
                  {...register("publishedPriceCents")}
                />
                {errors.publishedPriceCents && (
                  <p className="text-xs text-destructive">{errors.publishedPriceCents.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 max-w-xs">
                <Label htmlFor="unit">Unit</Label>
                <Controller
                  control={control}
                  name="unit"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lb">per lb</SelectItem>
                        <SelectItem value="l">per L</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 flex flex-col gap-2">
              <Label>Price bands (which budgets can show this item)</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Controller
                  control={control}
                  name="bandCodes"
                  render={({ field }) => (
                    <>
                      {BAND_CODES.map((code) => {
                        const band = bands.find((b) => b.code === code);
                        const checked = field.value?.includes(code);
                        return (
                          <label key={code} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) => {
                                const set = new Set(field.value ?? []);
                                if (next) set.add(code);
                                else set.delete(code);
                                field.onChange(Array.from(set));
                              }}
                            />
                            {band?.label ?? code}
                          </label>
                        );
                      })}
                    </>
                  )}
                />
              </div>
              {errors.bandCodes && (
                <p className="text-xs text-destructive">{errors.bandCodes.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            Active (visible for assignment / ordering)
          </label>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minQuantity">Minimum quantity</Label>
            <Input id="minQuantity" type="number" min={1} {...register("minQuantity")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leadTimeDays">Lead time (days)</Label>
            <Input id="leadTimeDays" type="number" min={0} {...register("leadTimeDays")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {mode === "create" ? "Create item" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

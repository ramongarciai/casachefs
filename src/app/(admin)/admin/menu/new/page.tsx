import { db } from "@/db";
import { pricingBands } from "@/db/schema/pricing";
import { MenuItemForm } from "../menu-item-form";

export default async function NewMenuItemPage() {
  const bands = await db.select().from(pricingBands);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New menu item</h1>
      <MenuItemForm
        mode="create"
        defaultValues={{}}
        bands={bands.map((b) => ({ code: b.code, label: b.label, serviceLine: b.serviceLine }))}
      />
    </div>
  );
}

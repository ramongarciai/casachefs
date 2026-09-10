import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderRestrictions, orderAddons, addresses } from "@/db/schema/orders";
import { menuItems } from "@/db/schema/menu";
import { pricingBands } from "@/db/schema/pricing";
import { feeRules } from "@/db/schema/fee-rules";
import { addons, addonVariants } from "@/db/schema/addons";
import { quotes } from "@/db/schema/quotes";
import { OrderReviewWorkspace } from "./workspace";
import { FrozenOrderReview } from "./frozen-order-review";

export const dynamic = "force-dynamic";

export default async function OrderReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) notFound();

  // Frozen food orders have no band, no per-person pricing, and no
  // quote-negotiation workflow — published prices are charged directly.
  // Route them to a much simpler review view instead of forcing the
  // band-centric workspace to handle a null band everywhere.
  if (order.orderType === "frozen_food") {
    const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const menuItemIds = itemRows.map((i) => i.menuItemId);
    const menuItemRows = menuItemIds.length
      ? await db.query.menuItems.findMany({ where: (m, { inArray }) => inArray(m.id, menuItemIds) })
      : [];
    const menuItemById = new Map(menuItemRows.map((m) => [m.id, m]));

    return (
      <FrozenOrderReview
        order={order}
        items={itemRows.map((i) => {
          const menuItem = menuItemById.get(i.menuItemId);
          return {
            id: i.id,
            nameEn: menuItem?.nameEn ?? "(deleted item)",
            quantity: i.quantity,
            unit: menuItem?.unit ?? "lb",
            unitPriceCents: menuItem?.publishedPriceCents ?? 0,
          };
        })}
      />
    );
  }

  const [
    address,
    itemRows,
    restrictionRows,
    addonRows,
    allMenuItems,
    allAddons,
    allVariants,
    band,
    feeRuleRow,
    quoteRows,
  ] = await Promise.all([
    order.addressId ? db.query.addresses.findFirst({ where: eq(addresses.id, order.addressId) }) : null,
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderRestrictions).where(eq(orderRestrictions.orderId, id)),
    db.select().from(orderAddons).where(eq(orderAddons.orderId, id)),
    db.query.menuItems.findMany({ where: eq(menuItems.active, true) }),
    db.query.addons.findMany({ where: eq(addons.active, true) }),
    db.select().from(addonVariants).where(eq(addonVariants.active, true)),
    order.bandCode ? db.query.pricingBands.findFirst({ where: eq(pricingBands.code, order.bandCode) }) : null,
    db.query.feeRules.findFirst({ where: eq(feeRules.id, "default") }),
    db.select().from(quotes).where(eq(quotes.orderId, id)).orderBy(desc(quotes.version)),
  ]);

  if (!band || !feeRuleRow) {
    throw new Error("Order is missing its pricing band or fee_rules — data integrity issue");
  }

  const menuItemById = new Map(allMenuItems.map((m) => [m.id, m]));
  const items = itemRows.map((i) => {
    const menuItem = menuItemById.get(i.menuItemId);
    return {
      id: i.id,
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      nameEn: menuItem?.nameEn ?? "(deleted item)",
      category: menuItem?.category ?? "",
      internalCostCents: menuItem?.internalCostCents ?? 0,
    };
  });

  const variantsByAddon = new Map<string, typeof allVariants>();
  for (const v of allVariants) {
    const list = variantsByAddon.get(v.addonId) ?? [];
    list.push(v);
    variantsByAddon.set(v.addonId, list);
  }

  const addonById = new Map(allAddons.map((a) => [a.id, a]));
  const variantById = new Map(allVariants.map((v) => [v.id, v]));
  const currentAddons = addonRows.map((oa) => ({
    id: oa.id,
    addonId: oa.addonId,
    addonVariantId: oa.addonVariantId,
    quantity: oa.quantity,
    unitPriceCentsSnapshot: oa.unitPriceCentsSnapshot,
    notes: oa.notes,
    nameEn: addonById.get(oa.addonId)?.nameEn ?? "(deleted add-on)",
    variantNameEn: oa.addonVariantId ? (variantById.get(oa.addonVariantId)?.nameEn ?? null) : null,
  }));

  return (
    <OrderReviewWorkspace
      order={order}
      address={address ?? null}
      restrictions={restrictionRows}
      items={items}
      addons={currentAddons}
      catalogMenuItems={allMenuItems.map((m) => ({
        id: m.id,
        nameEn: m.nameEn,
        category: m.category,
        internalCostCents: m.internalCostCents,
      }))}
      catalogAddons={allAddons.map((a) => ({
        id: a.id,
        nameEn: a.nameEn,
        category: a.category,
        unit: a.unit,
        unitPriceCents: a.unitPriceCents,
        variants: (variantsByAddon.get(a.id) ?? []).map((v) => ({ id: v.id, nameEn: v.nameEn })),
      }))}
      band={{ deliveryPctBps: band.deliveryPctBps, tipPctBps: band.tipPctBps }}
      defaultTaxRateBps={feeRuleRow.taxRateBps}
      quoteHistory={quoteRows.map((q) => ({
        id: q.id,
        version: q.version,
        grandTotalCents: q.grandTotalCents,
        status: q.status,
        createdAt: q.createdAt,
      }))}
    />
  );
}

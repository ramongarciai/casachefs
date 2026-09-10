import { redirect } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { addresses, orders, orderItems, orderRestrictions } from "@/db/schema/orders";
import { menuItems } from "@/db/schema/menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReorderButton } from "./reorder-button";
import type { OrderForReorder } from "./reorder";

export const dynamic = "force-dynamic";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  event_catering: "Event Catering",
  box_lunch_employee: "Employee Box Lunch",
  box_lunch_training: "Training Box Lunch",
  box_lunch_breakfast: "Breakfast Box Lunch",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/account/login");
  }

  const userId = session.user.id;

  const [addressRows, orderRows] = await Promise.all([
    db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.createdAt)),
    db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)),
  ]);

  // De-dupe saved addresses for display — repeat orders to the same place
  // shouldn't clutter the list.
  const seen = new Set<string>();
  const savedAddresses = addressRows.filter((a) => {
    const key = `${a.line1.toLowerCase()}|${a.zip}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const orderIds = orderRows.map((o) => o.id);
  const [itemRows, restrictionRows] = orderIds.length
    ? await Promise.all([
        db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)),
        db.select().from(orderRestrictions).where(inArray(orderRestrictions.orderId, orderIds)),
      ])
    : [[], []];

  const menuItemIds = Array.from(new Set(itemRows.map((i) => i.menuItemId)));
  const menuItemRows = menuItemIds.length
    ? await db.select().from(menuItems).where(inArray(menuItems.id, menuItemIds))
    : [];
  const menuItemNameById = new Map(menuItemRows.map((m) => [m.id, m.nameEn]));

  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  const restrictionsByOrder = new Map<string, typeof restrictionRows>();
  for (const r of restrictionRows) {
    const list = restrictionsByOrder.get(r.orderId) ?? [];
    list.push(r);
    restrictionsByOrder.set(r.orderId, list);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My account</h1>
          <p className="text-muted-foreground">{session.user.email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      {savedAddresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved addresses</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {savedAddresses.map((a) => (
              <div key={a.id} className="rounded-md border p-2">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.zip}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Order history</h2>
        {orderRows.length === 0 && (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        )}
        {orderRows.map((order) => {
          const items = itemsByOrder.get(order.id) ?? [];
          const restrictions = restrictionsByOrder.get(order.id) ?? [];
          const reorderData: OrderForReorder = {
            orderType: order.orderType,
            budgetMode: order.budgetMode,
            budgetAmountCents: order.budgetAmountCents,
            selectedPackageId: order.selectedPackageId,
            selectedItemIds: items.map((i) => i.menuItemId),
            restrictions: restrictions.map((r) => ({
              type: r.type,
              value: r.value,
              affectedGuestCount: r.affectedGuestCount,
            })),
          };

          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                  </CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
                  <span>
                    {order.eventDate} at {order.eventTime}
                  </span>
                  <span>{order.guestCount} guests</span>
                  <span>{centsToDollars(order.grandTotalCents)} total</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {items.map((i) => menuItemNameById.get(i.menuItemId)).filter(Boolean).join(" · ")}
                </div>
                <div>
                  <ReorderButton order={reorderData} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

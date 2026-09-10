import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/db";
import { orders, orderItems, orderRestrictions, addresses } from "@/db/schema/orders";
import { requireStaff, UnauthorizedError } from "@/lib/auth-helpers";
import { BeoDocument } from "@/lib/pdf/beo-document";

const RESTRICTION_LABELS: Record<string, string> = {
  allergen: "Allergen",
  diet: "Diet",
  spice: "Spice",
  other: "Note",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
  const { id } = await params;

  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [address, itemRows, restrictionRows] = await Promise.all([
    order.addressId ? db.query.addresses.findFirst({ where: eq(addresses.id, order.addressId) }) : null,
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderRestrictions).where(eq(orderRestrictions.orderId, id)),
  ]);

  const menuItemIds = itemRows.map((i) => i.menuItemId);
  const menuItemRows = menuItemIds.length
    ? await db.query.menuItems.findMany({ where: (m, { inArray }) => inArray(m.id, menuItemIds) })
    : [];
  const nameById = new Map(menuItemRows.map((m) => [m.id, m.nameEn]));

  const allergyAlerts = restrictionRows.map((r) => {
    const label = RESTRICTION_LABELS[r.type] ?? r.type;
    const guests = r.affectedGuestCount ? ` — ${r.affectedGuestCount} guest(s)` : "";
    const note = r.note ? ` (${r.note})` : "";
    return `${label}: ${r.value.replaceAll("_", " ")}${guests}${note}`;
  });

  const buffer = await renderToBuffer(
    BeoDocument({
      data: {
        customerName: order.customerName,
        companyName: order.companyName,
        customerPhone: order.customerPhone,
        eventDate: order.eventDate,
        eventTime: order.eventTime,
        deliveryWindow: order.deliveryWindow,
        driverNotes: order.driverNotes,
        guestCount: order.guestCount,
        address: address
          ? { line1: address.line1, line2: address.line2, city: address.city, state: address.state, zip: address.zip }
          : null,
        allergyAlerts,
        items: itemRows.map((i) => ({ nameEn: nameById.get(i.menuItemId) ?? "(deleted item)", quantity: i.quantity })),
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="casa-chefs-beo-${order.eventDate}.pdf"`,
    },
  });
}

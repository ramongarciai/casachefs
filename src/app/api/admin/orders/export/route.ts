import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { requireStaff, UnauthorizedError } from "@/lib/auth-helpers";

function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

const COLUMNS: { header: string; get: (o: typeof orders.$inferSelect) => string | number | null }[] = [
  { header: "Order ID", get: (o) => o.id },
  { header: "Status", get: (o) => o.status },
  { header: "Customer name", get: (o) => o.customerName },
  { header: "Customer email", get: (o) => o.customerEmail },
  { header: "Customer phone", get: (o) => o.customerPhone },
  { header: "Company", get: (o) => o.companyName },
  { header: "Order type", get: (o) => o.orderType },
  { header: "Event date", get: (o) => o.eventDate },
  { header: "Event time", get: (o) => o.eventTime },
  { header: "Guest count", get: (o) => o.guestCount },
  { header: "Budget mode", get: (o) => o.budgetMode },
  { header: "Budget amount", get: (o) => (o.budgetAmountCents / 100).toFixed(2) },
  { header: "Grand total", get: (o) => (o.grandTotalCents / 100).toFixed(2) },
  { header: "Created", get: (o) => o.createdAt.toISOString() },
];

export async function GET() {
  try {
    await requireStaff();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }

  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));

  const lines = [
    COLUMNS.map((c) => csvEscape(c.header)).join(","),
    ...rows.map((row) => COLUMNS.map((c) => csvEscape(c.get(row))).join(",")),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="casa-chefs-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

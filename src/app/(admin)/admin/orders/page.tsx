import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderRestrictions } from "@/db/schema/orders";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ORDER_TYPE_LABELS: Record<string, string> = {
  event_catering: "Event Catering",
  box_lunch_employee: "Employee Box Lunch",
  box_lunch_training: "Training Box Lunch",
  box_lunch_breakfast: "Breakfast Box Lunch",
  frozen_food: "Frozen Food",
};

export default async function AdminOrdersPage() {
  const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const orderIds = orderRows.map((o) => o.id);

  const restrictionRows = orderIds.length
    ? await db
        .select({ orderId: orderRestrictions.orderId })
        .from(orderRestrictions)
        .where(inArray(orderRestrictions.orderId, orderIds))
    : [];
  const hasRestrictions = new Set(restrictionRows.map((r) => r.orderId));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <a href="/api/admin/orders/export" className="text-sm text-primary hover:underline">
          Export CSV
        </a>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderRows.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                  {order.customerName}
                </Link>
                <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
              </TableCell>
              <TableCell>{ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}</TableCell>
              <TableCell>
                {order.eventDate} {order.eventTime}
              </TableCell>
              <TableCell>{order.guestCount}</TableCell>
              <TableCell>${(order.grandTotalCents / 100).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="capitalize">
                    {order.status.replace("_", " ")}
                  </Badge>
                  {hasRestrictions.has(order.id) && (
                    <Badge variant="destructive">Allergy/diet</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Link href={`/admin/orders/${order.id}`} className="text-sm text-primary hover:underline">
                  Review
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {orderRows.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
    </div>
  );
}

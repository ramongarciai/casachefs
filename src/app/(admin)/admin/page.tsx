import Link from "next/link";
import { asc, gte } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  quote_sent: "Quote sent",
  changes_requested: "Changes requested",
  approved: "Approved",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [allOrders, upcoming] = await Promise.all([
    db.select().from(orders),
    db.select().from(orders).where(gte(orders.eventDate, today)).orderBy(asc(orders.eventDate)).limit(8),
  ]);

  const countByStatus = new Map<string, number>();
  for (const o of allOrders) {
    countByStatus.set(o.status, (countByStatus.get(o.status) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {allOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {orderStatusEnum.enumValues.map((status) => (
                <div key={status} className="rounded-lg border p-3">
                  <div className="text-2xl font-semibold">{countByStatus.get(status) ?? 0}</div>
                  <div className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming events</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled.</p>}
          {upcoming.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted/50"
            >
              <div>
                <div className="font-medium">{o.customerName}</div>
                <div className="text-xs text-muted-foreground">
                  {o.eventDate} at {o.eventTime}
                  {o.orderType !== "frozen_food" && ` · ${o.guestCount} guests`}
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {o.status.replace("_", " ")}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

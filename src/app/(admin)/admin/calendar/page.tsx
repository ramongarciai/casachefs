import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseMonthParam(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return { year: y, monthIndex: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

function formatMonthParam(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { year, monthIndex } = parseMonthParam(month);

  const orderRows = await db.select().from(orders);
  const ordersByDate = new Map<string, typeof orderRows>();
  for (const o of orderRows) {
    const list = ordersByDate.get(o.eventDate) ?? [];
    list.push(o);
    ordersByDate.set(o.eventDate, list);
  }

  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = monthIndex === 0 ? { year: year - 1, monthIndex: 11 } : { year, monthIndex: monthIndex - 1 };
  const nextMonth = monthIndex === 11 ? { year: year + 1, monthIndex: 0 } : { year, monthIndex: monthIndex + 1 };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {MONTH_NAMES[monthIndex]} {year}
        </h1>
        <div className="flex gap-3">
          <Link
            href={`/admin/calendar?month=${formatMonthParam(prevMonth.year, prevMonth.monthIndex)}`}
            className="text-sm text-primary hover:underline"
          >
            ← Prev
          </Link>
          <Link
            href={`/admin/calendar?month=${formatMonthParam(nextMonth.year, nextMonth.monthIndex)}`}
            className="text-sm text-primary hover:underline"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
        {WEEKDAY_NAMES.map((d) => (
          <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const dateStr = day
            ? `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : null;
          const dayOrders = dateStr ? (ordersByDate.get(dateStr) ?? []) : [];
          return (
            <div key={i} className="min-h-24 bg-background p-1.5">
              {day && <div className="text-xs text-muted-foreground">{day}</div>}
              <div className="mt-1 flex flex-col gap-1">
                {dayOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="block truncate rounded bg-primary/10 px-1 py-0.5 text-[11px] hover:bg-primary/20"
                  >
                    {o.eventTime} {o.customerName}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

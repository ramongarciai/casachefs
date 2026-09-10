import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema/quotes";
import { orders } from "@/db/schema/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Read-only for now — Approve / Request changes / Decline and the signature
// capture are phase 7 (spec section 4.4). This just proves the "Send
// revised quote" link actually goes somewhere real.
export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, id) });
  if (!quote) notFound();

  const order = await db.query.orders.findFirst({ where: eq(orders.id, quote.orderId) });
  if (!order) notFound();

  return (
    <div className="mx-auto flex max-w-lg flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quote v{quote.version}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="text-muted-foreground">
            For {order.customerName} — {order.eventDate} at {order.eventTime}, {order.guestCount} guests.
          </p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Food subtotal</span>
            <span>{centsToDollars(quote.foodSubtotalCents)}</span>
          </div>
          {quote.addonsSubtotalCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Add-ons</span>
              <span>{centsToDollars(quote.addonsSubtotalCents)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span>{centsToDollars(quote.deliveryFeeCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gratuity</span>
            <span>{centsToDollars(quote.tipCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{centsToDollars(quote.taxCents)}</span>
          </div>
          {quote.discountCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{centsToDollars(quote.discountCents)}</span>
            </div>
          )}
          {quote.surchargeCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Surcharge</span>
              <span>{centsToDollars(quote.surchargeCents)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Grand total</span>
            <span>{centsToDollars(quote.grandTotalCents)}</span>
          </div>
          {quote.customerNotes && (
            <p className="mt-2 rounded bg-muted p-2 text-xs">{quote.customerNotes}</p>
          )}
          <p className="mt-4 rounded bg-muted p-2 text-xs text-muted-foreground">
            Approving or requesting changes online is coming soon — reply to your quote email or call us in the
            meantime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema/quotes";
import { orders } from "@/db/schema/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QuoteActions } from "./quote-actions";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_LABELS: Record<string, string> = {
  sent: "Awaiting your response",
  approved: "Approved",
  changes_requested: "Changes requested",
  declined: "Declined",
};

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
          <div className="flex items-center justify-between">
            <CardTitle>Quote v{quote.version}</CardTitle>
            <Badge variant={quote.status === "approved" ? "default" : "secondary"}>
              {STATUS_LABELS[quote.status] ?? quote.status}
            </Badge>
          </div>
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
          {quote.customerNotes && <p className="mt-2 rounded bg-muted p-2 text-xs">{quote.customerNotes}</p>}

          <Link href={`/api/quotes/${quote.id}/pdf`} target="_blank" className="text-xs text-primary hover:underline">
            Download PDF
          </Link>

          {quote.status === "sent" ? (
            <QuoteActions quoteId={quote.id} />
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              This quote has already been responded to. Contact us if you need to make further changes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/db";
import { quotes, quoteApprovals } from "@/db/schema/quotes";
import { orders } from "@/db/schema/orders";
import { QuoteDocument } from "@/lib/pdf/quote-document";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, id) });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await db.query.orders.findFirst({ where: eq(orders.id, quote.orderId) });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let approval: { signatureName: string; approvedAt: string } | null = null;
  if (quote.status === "approved") {
    const approvalRow = await db.query.quoteApprovals.findFirst({
      where: eq(quoteApprovals.quoteId, quote.id),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    });
    if (approvalRow?.signatureName) {
      approval = { signatureName: approvalRow.signatureName, approvedAt: approvalRow.createdAt.toISOString() };
    }
  }

  const buffer = await renderToBuffer(
    QuoteDocument({
      data: {
        version: quote.version,
        customerName: order.customerName,
        eventDate: order.eventDate,
        eventTime: order.eventTime,
        guestCount: order.guestCount,
        foodSubtotalCents: quote.foodSubtotalCents,
        addonsSubtotalCents: quote.addonsSubtotalCents,
        deliveryFeeCents: quote.deliveryFeeCents,
        tipCents: quote.tipCents,
        taxCents: quote.taxCents,
        discountCents: quote.discountCents,
        surchargeCents: quote.surchargeCents,
        discountSurchargeReason: quote.discountSurchargeReason,
        grandTotalCents: quote.grandTotalCents,
        customerNotes: quote.customerNotes,
        approval,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="casa-chefs-quote-v${quote.version}.pdf"`,
    },
  });
}

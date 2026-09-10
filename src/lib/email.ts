import "server-only";
import { Resend } from "resend";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export interface OrderEmailSummary {
  orderId: string;
  customerName: string;
  customerEmail: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  pricePerPersonCents: number;
  foodSubtotalCents: number;
  addonsSubtotalCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  taxCents: number;
  grandTotalCents: number;
}

function itemizedLines(order: OrderEmailSummary): string {
  const lines = [
    `Price per person: ${centsToDollars(order.pricePerPersonCents)}`,
    `Food subtotal: ${centsToDollars(order.foodSubtotalCents)}`,
  ];
  if (order.addonsSubtotalCents > 0) {
    lines.push(`Add-ons: ${centsToDollars(order.addonsSubtotalCents)}`);
  }
  lines.push(
    `Delivery: ${centsToDollars(order.deliveryFeeCents)}`,
    `Gratuity: ${centsToDollars(order.tipCents)}`,
    `Tax: ${centsToDollars(order.taxCents)}`,
    `Grand total: ${centsToDollars(order.grandTotalCents)}`,
  );
  return lines.join("\n");
}

/**
 * Every call here is best-effort: a failed email must never block order
 * submission, since the database row is the source of truth. Callers should
 * catch and log, not propagate.
 */
function getResendClient(): Resend | null {
  if (!process.env.AUTH_RESEND_KEY) return null;
  return new Resend(process.env.AUTH_RESEND_KEY);
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function sendOrderConfirmationEmail(order: OrderEmailSummary) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("sendOrderConfirmationEmail: no AUTH_RESEND_KEY configured, skipping");
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Casa Chefs <orders@casachefs.com>",
    to: order.customerEmail,
    subject: "We received your request — Casa Chefs",
    text: [
      `Hi ${order.customerName},`,
      "",
      "Thanks for your request. This is a preliminary request, not a confirmed order — our team will review it and follow up with a formal quote.",
      "",
      `Event: ${order.eventDate} at ${order.eventTime}, ${order.guestCount} guests`,
      "",
      itemizedLines(order),
      "",
      "— Casa Chefs",
    ].join("\n"),
  });
}

export interface QuoteEmailSummary {
  quoteId: string;
  version: number;
  customerName: string;
  customerEmail: string;
  grandTotalCents: number;
}

export async function sendQuoteEmail(quote: QuoteEmailSummary) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("sendQuoteEmail: no AUTH_RESEND_KEY configured, skipping");
    return;
  }

  const link = `${getSiteUrl()}/quote/${quote.quoteId}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Casa Chefs <orders@casachefs.com>",
    to: quote.customerEmail,
    subject: `Your Casa Chefs quote (v${quote.version}) — ${centsToDollars(quote.grandTotalCents)}`,
    text: [
      `Hi ${quote.customerName},`,
      "",
      `Here's your revised quote, totaling ${centsToDollars(quote.grandTotalCents)}.`,
      "",
      `Review and respond: ${link}`,
      "",
      "— Casa Chefs",
    ].join("\n"),
  });
}

export async function sendAdminNotificationEmail(order: OrderEmailSummary) {
  const resend = getResendClient();
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!resend || !adminEmail) {
    console.warn("sendAdminNotificationEmail: missing AUTH_RESEND_KEY or ADMIN_NOTIFICATION_EMAIL, skipping");
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Casa Chefs <orders@casachefs.com>",
    to: adminEmail,
    subject: `New order request — ${order.customerName} (${order.eventDate})`,
    text: [
      `New order request #${order.orderId}`,
      `${order.customerName} <${order.customerEmail}>`,
      `Event: ${order.eventDate} at ${order.eventTime}, ${order.guestCount} guests`,
      "",
      itemizedLines(order),
    ].join("\n"),
  });
}

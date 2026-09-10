"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes, quoteApprovals } from "@/db/schema/quotes";
import { orders } from "@/db/schema/orders";
import { sendAdminQuoteResponseNotification } from "@/lib/email";

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

export async function approveQuote(quoteId: string, signatureName: string) {
  if (!signatureName.trim()) throw new Error("A signature name is required");

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote) throw new Error("Quote not found");

  const ipAddress = await getClientIp();

  await db.insert(quoteApprovals).values({
    quoteId,
    action: "approved",
    signatureName: signatureName.trim(),
    ipAddress,
  });

  await db.update(quotes).set({ status: "approved" }).where(eq(quotes.id, quoteId));
  await db
    .update(orders)
    .set({ status: "approved", approvedQuoteId: quoteId, updatedAt: new Date() })
    .where(eq(orders.id, quote.orderId));

  revalidatePath(`/quote/${quoteId}`);
  return { status: "ok" as const };
}

export async function requestQuoteChanges(quoteId: string, note: string) {
  if (!note.trim()) throw new Error("Please describe what you'd like changed");

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote) throw new Error("Quote not found");

  const ipAddress = await getClientIp();

  await db.insert(quoteApprovals).values({
    quoteId,
    action: "changes_requested",
    note: note.trim(),
    ipAddress,
  });

  await db.update(quotes).set({ status: "changes_requested" }).where(eq(quotes.id, quoteId));
  await db.update(orders).set({ status: "changes_requested", updatedAt: new Date() }).where(eq(orders.id, quote.orderId));

  try {
    await sendAdminQuoteResponseNotification({ orderId: quote.orderId, action: "changes_requested", note: note.trim() });
  } catch (err) {
    console.error("Failed to notify admin of requested changes:", err);
  }

  revalidatePath(`/quote/${quoteId}`);
  return { status: "ok" as const };
}

export async function declineQuote(quoteId: string, note?: string) {
  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote) throw new Error("Quote not found");

  const ipAddress = await getClientIp();

  await db.insert(quoteApprovals).values({
    quoteId,
    action: "declined",
    note: note?.trim() || null,
    ipAddress,
  });

  await db.update(quotes).set({ status: "declined" }).where(eq(quotes.id, quoteId));
  await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, quote.orderId));

  try {
    await sendAdminQuoteResponseNotification({ orderId: quote.orderId, action: "declined", note: note?.trim() });
  } catch (err) {
    console.error("Failed to notify admin of decline:", err);
  }

  revalidatePath(`/quote/${quoteId}`);
  return { status: "ok" as const };
}

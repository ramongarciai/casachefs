import "server-only";
import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authorized");
  }
}

/**
 * Server-side authorization gate. Call this at the top of every admin
 * server action and route handler — the (admin) layout redirect only
 * protects page renders, not server actions invoked directly.
 */
export async function requireStaff() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
    throw new UnauthorizedError();
  }
  return session;
}

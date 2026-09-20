import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporary site-wide password gate for pre-launch. Off by default — set
// SITE_LOCK_ENABLED=true (plus user/password) in the environment to turn it
// on, and unset/change it back to remove the gate. No code change needed
// either way.
export function proxy(request: NextRequest) {
  if (process.env.SITE_LOCK_ENABLED !== "true") {
    return NextResponse.next();
  }

  const lockUser = process.env.SITE_LOCK_USER;
  const lockPassword = process.env.SITE_LOCK_PASSWORD;

  // Fail open on misconfiguration — never lock ourselves out because a
  // required env var is missing.
  if (!lockUser || !lockPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const user = separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex);
    const password = separatorIndex === -1 ? "" : decoded.slice(separatorIndex + 1);

    if (user === lockUser && password === lockPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Casa Chefs"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

import { resolveMiddlewareRouting } from "@/lib/roles";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const hasToken = Boolean(token);
    const tokenRole = token?.role as string | undefined;

    const result = resolveMiddlewareRouting(pathname, tokenRole, hasToken);

    if (result.action === "redirect") {
      return NextResponse.redirect(new URL(result.path, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized() {
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|uploads|verify).*)"],
};

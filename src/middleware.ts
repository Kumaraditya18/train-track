import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/auth/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/workout",
    "/workout/:path*",
    "/progress",
    "/progress/:path*",
    "/admin",
    "/admin/:path*",
  ],
};

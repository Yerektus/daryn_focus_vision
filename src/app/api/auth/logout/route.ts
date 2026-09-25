import { NextResponse } from "next/server";
import { COOKIE_NAME, cookieOptions } from "@/lib/session";

export const runtime = "nodejs";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}

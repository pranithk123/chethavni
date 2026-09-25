import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Protected pages and actions perform their own server-side authorization.
  // Avoid an extra remote auth request before every navigation and form action.
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

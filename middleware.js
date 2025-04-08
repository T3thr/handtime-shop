import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret });

  // Check if the request is for the /account page or its subpaths
  if (req.nextUrl.pathname.startsWith("/account")) {
    // If no token exists, redirect to the sign-in page
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.search = `callbackUrl=${encodeURIComponent(req.nextUrl.href)}`; // Preserve the original URL for redirect after login
      return NextResponse.redirect(url);
    }
  }

  // Allow the request to proceed if authenticated or if the route doesn't require auth
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"], // Apply middleware to /account and its subpaths
};
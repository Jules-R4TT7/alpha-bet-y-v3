import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Protected routes - require authentication
  if (pathname.startsWith("/profile") && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }

  return undefined;
});

export const config = {
  matcher: ["/profile/:path*"],
};

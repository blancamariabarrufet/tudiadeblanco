import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const featureRoutes: Record<string, string> = {
  "/manage/guests": "guests",
  "/manage/seating": "seating",
  "/manage/dietary": "dietary",
  "/manage/budget": "budget",
  "/manage/chatbot": "chatbot",
  "/manage/news": "news",
  "/manage/letters": "letters",
};

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-change-in-production-32chars"
  );
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("panel_session")?.value;

  let user: { isAdmin?: boolean; features?: string[] } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      user = payload as { isAdmin?: boolean; features?: string[] };
    } catch {}
  }

  // Redirect unauthenticated users away from manage routes
  if (!user && path.startsWith("/manage")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login
  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/manage/dashboard", request.url));
  }

  if (user && ["/register", "/forgot-password", "/reset-password"].includes(path)) {
    return NextResponse.redirect(new URL("/manage/dashboard", request.url));
  }

  // Block non-admins from the admin panel
  if (user && path.startsWith("/manage/admin") && !user.isAdmin) {
    return NextResponse.redirect(new URL("/manage/dashboard", request.url));
  }

  const requiredFeature = Object.entries(featureRoutes).find(([route]) =>
    path === route || path.startsWith(`${route}/`)
  )?.[1];

  if (
    user &&
    requiredFeature &&
    !user.isAdmin &&
    !user.features?.includes(requiredFeature)
  ) {
    return NextResponse.redirect(new URL("/manage/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage/:path*", "/login", "/register", "/forgot-password", "/reset-password"],
};

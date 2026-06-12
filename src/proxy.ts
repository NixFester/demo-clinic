import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Skip public routes ───
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // ─── Skip static files and Next.js internals ───
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ─── Authenticate ───
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not authenticated → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;
  const userId = (token.sub ?? "") as string;
  const accessToken = (token.accessToken ?? "") as string;

  // ─── Root redirect based on role ───
  if (pathname === "/") {
    const redirectMap: Record<string, string> = {
      admin: "/admin/dashboard",
      superadmin: "/admin/dashboard",
      dokter: "/dokter/dashboard",
      karyawan: "/karyawan/dashboard",
      kasir: "/kasir/dashboard",
    };
    return NextResponse.redirect(
      new URL(redirectMap[role] || "/login", request.url)
    );
  }

  // ─── Role-based route protection ───
  if (
    pathname.startsWith("/admin") &&
    role !== "admin" &&
    role !== "superadmin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  if (
    pathname.startsWith("/dokter") &&
    role !== "dokter" &&
    role !== "superadmin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  if (
    pathname.startsWith("/karyawan") &&
    role !== "karyawan" &&
    role !== "superadmin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  if (
    pathname.startsWith("/kasir") &&
    role !== "kasir" &&
    role !== "superadmin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // ─── PROXY CONVENTION: Inject auth headers for all remaining routes ───
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", userId);
  requestHeaders.set("x-user-role", role);
  
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  // Pass the request to your Next.js API routes / Server Components 
  // with the enriched headers (no external proxying)
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
import { NextResponse } from "next/server";

function decodeTokenPayload(token) {
  try {
    const [payload] = token.split(".");
    const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function proxy(request) {
  const token = request.cookies.get("nusantara_token")?.value;
  const payload = token ? decodeTokenPayload(token) : null;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    if (!payload || payload.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/riwayat")) {
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/riwayat/:path*"],
};

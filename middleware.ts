import { NextResponse, type NextRequest } from "next/server";

// Transmet l'adresse demandée aux pages, pour revenir au bon endroit après la connexion
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};

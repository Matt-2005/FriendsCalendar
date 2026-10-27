import { NextResponse, type NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    // Anti-CSRF : une modification ne peut venir que d'une page de ce site.
    // (next-auth a déjà sa propre protection, et le cron est appelé sans navigateur.)
    if (MUTATING.has(req.method) && !pathname.startsWith("/api/auth/")) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (origin && (!host || new URL(origin).host !== host)) {
        return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // Pages : transmet l'adresse demandée, pour revenir au bon endroit après la connexion
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Tout sauf les fichiers statiques
  matcher: ["/((?!_next/|.*\\..*).*)", "/api/:path*"],
};

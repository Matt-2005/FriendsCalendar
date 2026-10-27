import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProviderWrapper from "./providers/SessionProviderWrapper";
import OnboardingGate from "./components/OnboardingGate";
import SeasonalDecor from "./components/SeasonalDecor";
import { cookies } from "next/headers";
import { currentSeason, DECO_COOKIE } from "@/lib/season";
import { usingLocalDb } from "@/lib/authOptions";

export const metadata: Metadata = {
  title: { default: "Les Indécis Agenda", template: "%s · Les Indécis" },
  description: "Les sorties et les dispos du groupe, au même endroit.",
  applicationName: "Les Indécis",
  appleWebApp: { capable: true, title: "Les Indécis", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#121218" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Thème de saison (couleurs + décor), sauf si la personne l'a coupé dans son profil
  const decoOff = (await cookies()).get(DECO_COOKIE)?.value === "off";
  const season = decoOff ? null : currentSeason();
  return (
    <html lang="fr" data-season={season?.key}>
      <body>
        {season && <SeasonalDecor season={season.key} />}
        {process.env.NODE_ENV === "development" && (
          <div className={`env-badge ${usingLocalDb ? "is-test" : "is-prod"}`} aria-hidden>
            {usingLocalDb ? "🧪 TEST · base locale" : "⚠️ DEV sur la base de PRODUCTION"}
          </div>
        )}
        <SessionProviderWrapper>
          {children}
          <OnboardingGate />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

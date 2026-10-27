import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProviderWrapper from "./providers/SessionProviderWrapper";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Les Indécis Agenda",
    short_name: "Les Indécis",
    description: "Les sorties et les dispos du groupe, au même endroit.",
    start_url: "/events",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f5fb",
    theme_color: "#6c5ce7",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

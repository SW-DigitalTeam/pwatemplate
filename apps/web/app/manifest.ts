import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sport Waikato Programmes",
    short_name: "SW Programmes",
    description: "More people moving, more often, in ways that work for them.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#14532d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

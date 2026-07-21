import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Sport Waikato programmes",
  description: "More people moving, more often, in ways that work for them.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#14532d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-theme focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-contrast">
          Skip to main content
        </a>
        <main id="main">{children}</main>
        <OfflineIndicator />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

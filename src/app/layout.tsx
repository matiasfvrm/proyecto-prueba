import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBanner } from "@/components/layout/demo-banner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "UNsolved — Open problems, collaborative progress", template: "%s · UNsolved" },
  description:
    "Discover what remains unsolved, break complex challenges into research questions and tasks, and turn shared knowledge into evidence-backed progress.",
  openGraph: { siteName: "UNsolved", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-black">
          Skip to content
        </a>
        <ToastProvider>
          <StoreProvider>
            <DemoBanner />
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

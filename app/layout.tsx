import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";
;



export const metadata: Metadata = {
  title: "OneTap Earn – DeFi Yield Made Simple",
  description: "The simplest way to earn yield on your crypto. Powered by LI.FI.",
  manifest: "/manifest.json",
  icons: { apple: "/icon-192.png" },
  openGraph: {
    title: "OneTap Earn",
    description: "DeFi yield aggregator powered by LI.FI",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0F1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={` antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
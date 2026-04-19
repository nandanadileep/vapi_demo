import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CRITICAL_FALLBACK_CSS } from "@/lib/critical-fallback-css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Bloomindial",
  description:
    "Voice-first outreach for dermatology and skin & hair clinics. Warm calls, clear follow-ups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: CRITICAL_FALLBACK_CSS,
          }}
        />
      </head>
      <body className="bd-root min-h-screen bg-warm-off-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

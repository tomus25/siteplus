// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

const GA_ID = "G-0FVQQFK96Q"; // твой Measurement ID GA4

export const metadata: Metadata = {
  title: "SitePlus — Instant Website Prototype",
  description: "Beta demo. Generate a preview and request access.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-setup" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

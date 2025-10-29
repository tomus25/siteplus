// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

// --- можно зашить прямо строкой или брать из env ---
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-QJFFDJ1HFM"; // GA4 Measurement ID
const SA_SRC = process.env.NEXT_PUBLIC_SA_SRC || "https://scripts.simpleanalyticscdn.com/latest.js";

export const metadata: Metadata = {
  title: "SitePlus — Instant Website Prototype",
  description: "Beta demo. Generate a preview and request access.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* --- Google Analytics 4 (gtag.js) --- */}
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

        {/* --- Simple Analytics (privacy-first) --- */}
        {/* Никаких настроек не требуется: скрипт сам собирает pageviews */}
        <Script
          src={SA_SRC}
          async
          strategy="afterInteractive"
        />
        {/* (по желанию): <noscript> пиксель отслеживания, если нужны визиты без JS */}
        {/* 
        <noscript>
          <img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt="" referrerPolicy="no-referrer-when-downgrade" />
        </noscript>
        */}
      </head>
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

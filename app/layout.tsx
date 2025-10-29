// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script"; // 👈 добавляем импорт

export const metadata: Metadata = {
  title: "SitePlus — Instant Website Prototype",
  description: "Beta demo. Generate a preview and request access.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0FVQQFK96Q"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0FVQQFK96Q');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

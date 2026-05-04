import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ShopChrome } from "@/components/ShopChrome";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "KUVA — Marketplace",
  description: "The premier marketplace for Ugandan SMEs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-kuva-surface text-gray-900 min-h-screen`}
      >
        <div className="max-w-md mx-auto bg-kuva-cream min-h-screen shadow-nav relative pb-28">
          <ShopChrome>{children}</ShopChrome>
        </div>
      </body>
    </html>
  );
}

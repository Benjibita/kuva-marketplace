import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ShopChrome } from "@/components/ShopChrome";
import { NotificationProvider } from "@/app/context/NotificationContext";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "KUVA — Marketplace",
  description: "The premier marketplace for Ugandan SMEs.",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=5.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.className} antialiased text-gray-900 min-h-screen`}
      >
        <NotificationProvider>
          <div className="w-full h-full min-h-screen shadow-nav relative pb-28 flex justify-center">
            <div className="w-full max-w-4xl">
              <ShopChrome>{children}</ShopChrome>
            </div>
          </div>
        </NotificationProvider>
      </body>
    </html>
  );
}

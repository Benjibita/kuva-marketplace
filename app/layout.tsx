import type { Metadata, Viewport } from "next";
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
  appleWebApp: {
    capable: true,
    title: "KUVA",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.className} premium-glass antialiased text-gray-900 min-h-screen`}
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

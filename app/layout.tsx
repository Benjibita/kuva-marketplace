import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kuva Marketplace",
  description: "The premier marketplace for Ugandan SMEs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen">
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative pb-16">
          {children}
        </div>
      </body>
    </html>
  );
}

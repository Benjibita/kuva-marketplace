"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

const HIDE_NAV_PREFIXES = ["/vendor", "/login", "/signup", "/test", "/products/"];

export function ShopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <>
      {children}
      {!hideNav && <BottomNav />}
    </>
  );
}

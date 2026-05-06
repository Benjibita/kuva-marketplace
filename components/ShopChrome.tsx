"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

const ROOT_NAV_PATHS = new Set([
  "/",
  "/products",
  "/cart",
  "/settings",
  "/vendor/dashboard",
]);

export function ShopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = ROOT_NAV_PATHS.has(pathname);

  return (
    <>
      {children}
      {showNav && <BottomNav />}
    </>
  );
}

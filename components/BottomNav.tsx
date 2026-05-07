"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingCart, Store, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const items = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/products",
    label: "Browse",
    icon: Search,
    match: (p: string) => p.startsWith("/products"),
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingCart,
    match: (p: string) => p.startsWith("/cart"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isVendor, setIsVendor] = useState(false);
  const [vendorUnread, setVendorUnread] = useState(false);

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsVendor(user?.user_metadata?.role === "vendor");
    }

    void loadRole();
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.user_metadata?.role !== "vendor") {
        if (!cancelled) setVendorUnread(false);
        return;
      }

      const { count, error } = await supabase
        .from("vendor_notifications")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", user.id)
        .eq("status", "unread");

      if (error) {
        if (!cancelled) setVendorUnread(false);
        return;
      }
      if (!cancelled) setVendorUnread((count ?? 0) > 0);
    }

    void loadUnread();
    const t = setInterval(loadUnread, 12000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [supabase, pathname]);

  const navItems = useMemo(() => {
    const withProfile = [
      ...items,
      ...(isVendor
        ? [
            {
              href: "/vendor/dashboard",
              label: "Vendor",
              icon: Store,
              match: (p: string) => p.startsWith("/vendor"),
            },
          ]
        : []),
      {
        href: "/settings",
        label: "Profile",
        icon: User,
        match: (p: string) => p.startsWith("/settings"),
      },
    ];

    return withProfile;
  }, [isVendor]);

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/25 px-1.5 py-1.5 shadow-nav backdrop-blur-md"
      aria-label="Main navigation"
    >
      {navItems.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        const showVendorDot =
          href === "/vendor/dashboard" && isVendor && vendorUnread;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`kuva-nav-item group relative flex min-h-[44px] items-center justify-center overflow-hidden rounded-full py-2 text-sm font-medium transition-[background-color,color,transform,padding,min-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] ${
              active
                ? "min-w-[44px] bg-black px-3 text-white font-light shadow-nav-hover"
                : "min-w-[44px] px-2.5 text-white/85 hover:bg-white/12"
            } `}
          >
            <span className="relative flex items-center gap-0">
              <span className="relative inline-flex flex-col items-center">
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    active ? "scale-100" : "scale-100 group-hover:scale-105"
                  }`}
                  strokeWidth={1.75}
                  aria-hidden
                />
                {showVendorDot ? (
                  <span
                    className="pointer-events-none absolute -bottom-1 left-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red-500 ring-2 ring-white/40"
                    title="New order notifications"
                  />
                ) : null}
              </span>
              <span
                className={`inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  active
                    ? "ml-2 max-w-[5.5rem] opacity-100"
                    : "ml-0 max-w-0 opacity-0"
                }`}
                aria-hidden={!active}
              >
                {label}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

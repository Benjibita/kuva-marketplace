"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/products",
    label: "Shop",
    icon: ShoppingBag,
    match: (p: string) => p.startsWith("/products"),
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingCart,
    match: (p: string) => p.startsWith("/cart"),
  },
  {
    href: "/settings",
    label: "Profile",
    icon: User,
    match: (p: string) => p.startsWith("/settings"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black px-1.5 py-1.5 shadow-nav"
      aria-label="Main navigation"
    >
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`kuva-nav-item group relative flex min-h-[44px] items-center justify-center overflow-hidden rounded-full py-2 text-sm font-medium transition-[background-color,color,transform,padding,min-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] ${
              active
                ? "min-w-[44px] bg-white px-3 text-black"
                : "min-w-[44px] px-2.5 text-white/85 hover:bg-white/12"
            } `}
          >
            <span className="flex items-center gap-0">
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  active ? "scale-100" : "scale-100 group-hover:scale-105"
                }`}
                strokeWidth={1.75}
                aria-hidden
              />
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

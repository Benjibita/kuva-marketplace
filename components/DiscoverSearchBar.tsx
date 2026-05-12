"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function DiscoverSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  function hrefForQuery(nextQ: string) {
    const p = new URLSearchParams(searchParams.toString());
    const trimmed = nextQ.trim();
    if (trimmed) p.set("q", trimmed);
    else p.delete("q");
    p.delete("page");
    const qs = p.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.replace(hrefForQuery(q));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 flex gap-2 anim-slide-in-bottom anim-delay-100"
      role="search"
    >
      <label htmlFor="discover-search" className="sr-only">
        Search products
      </label>
      <input
        id="discover-search"
        type="search"
        enterKeyHint="search"
        placeholder="Search by name or description…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="min-h-[44px] flex-1 rounded-full border border-kuva-line/80 bg-white/90 px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-black/10"
      />
      <button
        type="submit"
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-gray-900 text-white shadow-sm transition hover:bg-black active:scale-95"
        aria-label="Search"
      >
        <Search className="h-5 w-5" strokeWidth={2} />
      </button>
    </form>
  );
}

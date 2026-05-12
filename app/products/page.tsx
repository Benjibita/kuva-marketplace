import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { CatalogEmptyState } from "@/components/CatalogEmptyState";
import { DiscoverSearchBar } from "@/components/DiscoverSearchBar";
import {
  getCategoryLabel,
  isKnownCategorySlug,
} from "@/lib/marketplaceCategories";
import { CATALOG_PRODUCT_SELECT } from "@/lib/catalogProductSelect";
import { escapeIlikePattern } from "@/lib/catalogSearchEscape";

const PAGE_SIZE = 24;

function firstString(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePageParam(raw: string | string[] | undefined): number {
  const v = firstString(raw);
  const n = parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: {
    category?: string | string[];
    q?: string | string[];
    page?: string | string[];
  };
}) {
  const supabase = createClient();
  const rawCat = firstString(searchParams.category);
  const categorySlug =
    rawCat && isKnownCategorySlug(rawCat) ? rawCat : undefined;
  const qRaw = firstString(searchParams.q)?.trim() ?? "";
  const pageRequested = parsePageParam(searchParams.page);

  let countQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  if (categorySlug) {
    countQuery = countQuery.eq("category", categorySlug);
  }
  if (qRaw.length > 0) {
    const safe = escapeIlikePattern(qRaw);
    const pattern = `%${safe}%`;
    countQuery = countQuery.or(
      `title.ilike.${pattern},description.ilike.${pattern}`
    );
  }

  const { count: totalCount, error: countError } = await countQuery;

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const effectivePage = Math.min(pageRequested, totalPages);
  const from = (effectivePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let dataQuery = supabase
    .from("products")
    .select(CATALOG_PRODUCT_SELECT)
    .is("deleted_at", null);

  if (categorySlug) {
    dataQuery = dataQuery.eq("category", categorySlug);
  }
  if (qRaw.length > 0) {
    const safe = escapeIlikePattern(qRaw);
    const pattern = `%${safe}%`;
    dataQuery = dataQuery.or(
      `title.ilike.${pattern},description.ilike.${pattern}`
    );
  }

  const { data: products, error } = await dataQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  const list = products ?? [];
  const categoryTitle =
    categorySlug != null ? getCategoryLabel(categorySlug) : null;

  function pageHref(nextPage: number) {
    const p = new URLSearchParams();
    if (categorySlug) p.set("category", categorySlug);
    if (qRaw) p.set("q", qRaw);
    if (nextPage > 1) p.set("page", String(nextPage));
    const qs = p.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  const showSearchEmpty =
    !error && !countError && list.length === 0 && qRaw.length > 0;

  return (
    <main className="min-h-screen px-4 pb-28 pt-4">
      <header className="sticky top-0 z-40 flex flex-col gap-1 border-b border-kuva-line/60 bg-white/40 px-0 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-700 transition hover:bg-black/5"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <h1 className="text-lg font-semibold text-gray-900">Discover</h1>
            {categoryTitle ? (
              <p className="truncate text-xs text-gray-500">{categoryTitle}</p>
            ) : null}
          </div>
          <span className="min-w-[44px]" aria-hidden />
        </div>
        <Suspense
          fallback={
            <div
              className="mt-3 h-11 w-full animate-pulse rounded-full bg-kuva-line/50"
              aria-hidden
            />
          }
        >
          <DiscoverSearchBar />
        </Suspense>
      </header>

      {(error || countError) && (
        <div className="anim-slide-in-bottom mt-4 rounded-3xl border border-kuva-accent/30 bg-white px-4 py-3 text-sm text-kuva-accent">
          Could not load products right now. Please refresh.
        </div>
      )}

      {!error && !countError && showSearchEmpty && (
        <div className="mt-6">
          <CatalogEmptyState
            title="No products match your search"
            description="Try different words or browse all categories."
          />
          <Link
            href="/products"
            className="anim-slide-in-bottom anim-delay-200 mx-auto mt-6 flex max-w-xs items-center justify-center gap-0.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Clear search
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      )}

      {!error &&
        !countError &&
        list.length === 0 &&
        qRaw.length === 0 && (
          <div className="mt-6">
            <CatalogEmptyState
              title="No products yet"
              description={
                categorySlug
                  ? "Nothing listed in this category yet."
                  : "Be the first to list something on KUVA."
              }
            />
            <Link
              href="/"
              className="anim-slide-in-bottom anim-delay-200 mx-auto mt-6 flex max-w-xs items-center justify-center gap-0.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              Back to home
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        )}

      {!error && !countError && list.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {list.map((product, i) => (
              <div
                key={product.id}
                className="anim-slide-in-bottom"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <ProductCard product={product as any} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-8 flex items-center justify-center gap-4 pb-4"
              aria-label="Catalogue pages"
            >
              <Link
                href={pageHref(effectivePage - 1)}
                aria-disabled={effectivePage <= 1}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-kuva-line bg-white px-4 text-sm font-medium shadow-sm transition ${
                  effectivePage <= 1
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-kuva-surface active:scale-95"
                }`}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                <span className="sr-only">Previous page</span>
              </Link>
              <span className="text-sm text-gray-600">
                Page {effectivePage} of {totalPages}
              </span>
              <Link
                href={pageHref(effectivePage + 1)}
                aria-disabled={effectivePage >= totalPages}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-kuva-line bg-white px-4 text-sm font-medium shadow-sm transition ${
                  effectivePage >= totalPages
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-kuva-surface active:scale-95"
                }`}
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
                <span className="sr-only">Next page</span>
              </Link>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

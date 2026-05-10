import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { CatalogEmptyState } from "@/components/CatalogEmptyState";
import { CATALOG_PRODUCT_SELECT } from "@/lib/catalogProductSelect";

type TrendingRow = {
  product_id: string;
  units_sold: number;
  checkout_count: number;
};

export default async function TrendingProductsPage() {
  const supabase = createClient();

  const { data: trendingRows, error: rpcError } = await supabase.rpc(
    "get_trending_product_ids",
    { p_days: 7, p_limit: 48 }
  );

  const rows = (trendingRows ?? []) as TrendingRow[];
  const ids = rows.map((r) => r.product_id).filter(Boolean);

  let orderedProducts: any[] = [];
  let productsFetchFailed = false;

  if (ids.length > 0) {
    const { data: fetched, error: fetchError } = await supabase
      .from("products")
      .select(CATALOG_PRODUCT_SELECT)
      .in("id", ids)
      .is("deleted_at", null);

    if (fetchError) {
      productsFetchFailed = true;
    } else if (fetched?.length) {
      const orderIndex = new Map(ids.map((id, i) => [id, i]));
      orderedProducts = [...fetched].sort(
        (a, b) =>
          (orderIndex.get(a.id) ?? 9999) - (orderIndex.get(b.id) ?? 9999)
      );
    }
  }

  const showRpcError =
    rpcError && ids.length === 0 && orderedProducts.length === 0;
  const showProductsFetchError = productsFetchFailed && ids.length > 0;

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
            <h1 className="text-lg font-semibold text-gray-900">
              Top selling picks
            </h1>
            <p className="text-xs text-gray-500">
              Based on paid checkouts in the last 7 days
            </p>
          </div>
          <span className="min-w-[44px]" aria-hidden />
        </div>
      </header>

      {(showRpcError || showProductsFetchError) && (
        <div className="anim-slide-in-bottom mt-4 rounded-3xl border border-kuva-accent/30 bg-white px-4 py-3 text-sm text-kuva-accent">
          Could not load trending products right now. Please refresh.
        </div>
      )}

      {!showRpcError &&
        !showProductsFetchError &&
        orderedProducts.length === 0 && (
        <div className="mt-6">
          <CatalogEmptyState
            title="No products yet"
            description="No trending products in the last 7 days."
          />
          <Link
            href="/products"
            className="anim-slide-in-bottom anim-delay-200 mx-auto mt-6 flex max-w-xs items-center justify-center gap-0.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Browse all products
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      )}

      {!showRpcError &&
        !showProductsFetchError &&
        orderedProducts.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {orderedProducts.map((product, i) => (
            <div
              key={product.id}
              className="anim-slide-in-bottom"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
            >
              <ProductCard product={product as any} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

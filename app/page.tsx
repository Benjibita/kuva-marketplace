import {
  ArrowUpRight,
  Search,
  ShoppingBag,
  Store,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { UserMenu } from "@/components/UserMenu";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { ProductCard } from "@/components/ProductCard";

const CATEGORIES = [
  "All",
  "Fashion",
  "Crafts",
  "Electronics",
  "Groceries",
  "Beauty",
  "Home",
];

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(`
      id,
      title,
      price_ugx,
      is_on_sale,
      sale_price_ugx,
      images,
      category,
      stock,
      vendor:profiles!vendor_id (
        business_name
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const safeProducts = products ?? [];

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-center border-b border-kuva-line/70 bg-kuva-cream/30 px-4 py-4 backdrop-blur-md anim-slide-in-bottom">
        <h1 className="text-3xl font-light tracking-tight text-gray-900">
          KUVA
        </h1>
      </header>

      {!user && (
        <section className="px-4 pt-4 anim-slide-in-bottom anim-delay-100">
          <div className="rounded-4xl border border-kuva-line/70 bg-white/85 p-5 shadow-card backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-kuva-lavender p-2 text-gray-900">
                <ShoppingBag className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-gray-900">
                  Create your account
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Save favorites, faster checkouts, manage your profile or even register your store.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href="/signup"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.98]"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-gray-300 bg-white/90 px-5 text-sm font-semibold text-gray-800 transition hover:bg-white active:scale-[0.98]"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {user && <WelcomeBanner name={user.user_metadata?.name} />}

      {/* Discovery cards */}
      <section
        className={`grid grid-cols-2 gap-3 px-4 anim-slide-in-bottom anim-delay-150 ${user ? "pt-3" : "pt-5"}`}
      >
        <Link
          href="/products"
          className="relative flex min-h-[120px] flex-col justify-between overflow-hidden rounded-4xl bg-kuva-lavender p-4 text-left shadow-card transition hover:shadow-card-hover active:scale-[0.98]"
        >
          <p className="max-w-[85%] text-sm font-semibold leading-snug text-gray-900">
            Explore all products
          </p>
          <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </span>
        </Link>
        <button
          type="button"
          className="relative flex min-h-[120px] flex-col justify-between overflow-hidden rounded-4xl bg-white p-4 text-left shadow-card transition hover:shadow-card-hover active:scale-[0.98]"
        >
          <p className="max-w-[85%] text-sm font-semibold leading-snug text-gray-900">
            Top selling picks
          </p>
          <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-kuva-surface text-gray-900">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </span>
        </button>
      </section>

      {/* Categories */}
      <section className="px-4 pt-6 anim-slide-in-bottom anim-delay-300">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Categories</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className="whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-card transition hover:bg-kuva-lavender/50 active:scale-95"
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="px-4 py-6 anim-slide-in-bottom anim-delay-400">
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            {safeProducts.length > 0 ? "Popular products" : "Products"}
          </h3>
          <Link
            href="/products"
            className="flex items-center gap-0.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            See all
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        {productsError && (
          <div className="anim-slide-in-bottom mb-4 rounded-3xl border border-kuva-accent/30 bg-white px-4 py-3 text-sm text-kuva-accent anim-delay-100">
            Could not load products right now. Please refresh.
          </div>
        )}

        {!productsError && safeProducts.length === 0 && (
          <div className="anim-slide-in-bottom anim-delay-150 rounded-5xl border border-dashed border-kuva-line bg-white px-6 py-12 text-center shadow-card">
            <Store
              className="mx-auto mb-3 h-12 w-12 text-gray-300"
              strokeWidth={1.25}
            />
            <p className="font-medium text-gray-600">No products yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Be the first to list something on KUVA.
            </p>
          </div>
        )}

        {safeProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {safeProducts.map((product, i) => (
              <div
                key={product.id}
                className="anim-slide-in-bottom"
                style={{ animationDelay: `${500 + Math.min(i, 10) * 45}ms` }}
              >
                <ProductCard product={product as any} />
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}

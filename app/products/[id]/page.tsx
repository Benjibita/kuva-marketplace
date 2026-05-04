import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flame, Share2, ShoppingCart } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, title, price_ugx, images, stock")
    .eq("id", params.id)
    .maybeSingle();

  if (!product) notFound();

  const imageUrl = product.images?.[0];
  const showDiscountPlaceholder = true;
  const listPrice = Math.round(product.price_ugx * 1.07);

  return (
    <main className="min-h-screen bg-kuva-cream pb-36">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-kuva-line/60 bg-kuva-cream/90 px-4 py-3 backdrop-blur-md anim-slide-in-bottom">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-card transition active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <h1 className="text-sm font-semibold text-gray-900">
          Product details
        </h1>
        <div className="relative flex h-11 w-11 items-center justify-center">
          <ShoppingCart
            className="h-5 w-5 text-gray-800"
            strokeWidth={1.75}
          />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-kuva-accent px-0.5 text-[10px] font-bold text-white">
            0
          </span>
        </div>
      </header>

      <div className="px-4 pt-4 anim-slide-in-bottom anim-delay-100">
        <div className="relative aspect-[4/5] overflow-hidden rounded-5xl bg-kuva-surface shadow-card">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 400px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}
        </div>

        {/* Variant thumbnails — placeholder strip */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide anim-slide-in-bottom anim-delay-200">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-kuva-line bg-kuva-surface"
            >
              {imageUrl && i === 0 ? (
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 anim-slide-in-bottom anim-delay-250">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold leading-snug tracking-tight text-gray-900">
            {product.title}
          </h2>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-card transition hover:bg-kuva-surface active:scale-95"
              aria-label="Trending (placeholder)"
            >
              <Flame className="h-4 w-4 text-kuva-accent" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-card transition hover:bg-kuva-surface active:scale-95"
              aria-label="Share (placeholder)"
            >
              <Share2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {product.stock > 0
            ? `${product.stock} in stock`
            : "Out of stock"}
        </p>

        <div className="mt-6 anim-slide-in-bottom anim-delay-300">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Size
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIZES.map((size, idx) => (
              <button
                key={size}
                type="button"
                className={`min-h-[44px] min-w-[48px] rounded-full px-4 text-sm font-medium transition active:scale-95 ${
                  idx === 3
                    ? "bg-kuva-lavender text-gray-900"
                    : "bg-white text-gray-700 shadow-card hover:bg-kuva-surface"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-3 anim-slide-in-bottom anim-delay-400">
          {showDiscountPlaceholder && (
            <p className="text-sm text-kuva-accent line-through">
              UGX {listPrice.toLocaleString()}
            </p>
          )}
          <p className="text-2xl font-bold text-gray-900">
            UGX {product.price_ugx.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-4 anim-slide-in-bottom anim-delay-500">
          <span className="text-sm text-gray-500">Quantity</span>
          <div className="flex items-center gap-3 rounded-full bg-white px-2 py-1.5 shadow-card">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-kuva-surface active:scale-95"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-semibold">
              1
            </span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-kuva-surface active:scale-95"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 left-0 right-0 mx-auto max-w-md px-4 anim-slide-in-bottom anim-delay-600">
        <button
          type="button"
          disabled={product.stock === 0}
          className="flex w-full min-h-[52px] items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to cart
        </button>
      </div>
    </main>
  );
}

'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, Share2, ShoppingCart, Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { addToCart } from "@/app/actions/cart";
import { useNotification } from "@/app/context/NotificationContext";
import { addGuestCartItem, getGuestCartCount } from "@/utils/guestCart";
import { PREDEFINED_SIZES } from "@/utils/productSizes";

interface Product {
  id: string;
  title: string;
  description?: string | null;
  price_ugx: number;
  is_on_sale: boolean;
  sale_price_ugx: number | null;
  use_size_variants?: boolean;
  use_size_specific_prices?: boolean;
  size_inventory?: Record<string, number>;
  size_prices?: Record<string, number>;
  images: string[];
  stock: number;
  vendor_id: string;
}

type SellerTrust = {
  label: string;
  ratingCount: number;
  publicAvg: number | null;
};

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sellerTrust, setSellerTrust] = useState<SellerTrust | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { addNotification } = useNotification();

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase
        .from("products")
        .select("id, vendor_id, title, description, price_ugx, is_on_sale, sale_price_ugx, use_size_variants, use_size_specific_prices, size_inventory, size_prices, images, stock")
        .eq("id", params.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!data) {
        router.push("/not-found");
        return;
      }

      setProduct(data);
      const vid = data.vendor_id;
      if (vid) {
        const [{ data: prof }, { data: sumRaw }] = await Promise.all([
          supabase
            .from("profiles")
            .select("business_name, phone_number")
            .eq("id", vid)
            .maybeSingle(),
          supabase.rpc("public_vendor_rating_summary", { p_vendor_id: vid }),
        ]);
        const sum = (
          sumRaw as { rating_count: number; average_stars: number | null }[] | null
        )?.[0];
        const label =
          prof?.business_name?.trim() ||
          prof?.phone_number?.trim() ||
          "Seller";
        setSellerTrust({
          label,
          ratingCount: sum?.rating_count ?? 0,
          publicAvg: sum?.average_stars ?? null,
        });
      } else {
        setSellerTrust(null);
      }
      if (data.use_size_variants) {
        const firstAvailable = PREDEFINED_SIZES.find(
          (size) => Number((data.size_inventory || {})[size] || 0) > 0
        );
        setSelectedSize(firstAvailable || null);
      }
      setLoading(false);
    }

    async function fetchCartCount() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: cartItems } = await supabase
            .from("cart_items")
            .select("id", { count: "exact" })
            .eq("user_id", user.id);
          setCartCount(cartItems?.length || 0);
          return;
        }

        setCartCount(getGuestCartCount());
      } catch {
        // Silently fail
      }
    }

    fetchProduct();
    fetchCartCount();
  }, [params.id, supabase, router]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      if (product.use_size_variants && !selectedSize) {
        throw new Error("Please select a size.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await addToCart(product.id, quantity, selectedSize);
        setCartCount((prev) => prev + 1);
      } else {
        addGuestCartItem(product.id, quantity, selectedSize);
        setCartCount(getGuestCartCount());
      }
      setQuantity(1);
      addNotification(`✓ ${product.title} added to cart`, 'success');
    } catch (error) {
      addNotification(
        error instanceof Error ? error.message : "Failed to add to cart",
        'error'
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const increaseQuantity = () => {
    if (!product) return;
    const maxStock =
      product.use_size_variants && selectedSize
        ? Number(product.size_inventory?.[selectedSize] || 0)
        : product.stock;

    if (quantity < maxStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-kuva-accent" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
      </main>
    );
  }

  const imageUrl = product.images?.[0];
  const hasSale =
    product.is_on_sale === true &&
    product.sale_price_ugx != null &&
    product.sale_price_ugx > 0 &&
    product.sale_price_ugx < product.price_ugx;
  const displayPrice = hasSale ? product.sale_price_ugx! : product.price_ugx;
  const activeSizePrice =
    selectedSize && product.use_size_specific_prices
      ? Number(product.size_prices?.[selectedSize] || 0)
      : null;
  const finalPrice = activeSizePrice && activeSizePrice > 0 ? activeSizePrice : displayPrice;
  const selectedSizeStock =
    product.use_size_variants && selectedSize
      ? Number(product.size_inventory?.[selectedSize] || 0)
      : product.stock;

  return (
    <main className="min-h-screen pb-36">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-kuva-line/60 bg-white/40 px-4 py-3 backdrop-blur-md anim-slide-in-bottom">
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
        <Link
          href="/cart"
          className="relative flex h-11 w-11 items-center justify-center"
        >
          <ShoppingCart
            className="h-5 w-5 text-gray-800"
            strokeWidth={1.75}
          />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-kuva-accent px-0.5 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
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

        {sellerTrust ? (
          <div className="mt-3 rounded-2xl border border-gray-100 bg-white/80 px-3 py-2.5 text-sm shadow-card">
            <p className="text-gray-700">
              Sold by{' '}
              <span className="font-semibold text-gray-900">{sellerTrust.label}</span>
            </p>
            {sellerTrust.publicAvg != null ? (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-amber-800">
                <Star
                  className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400"
                  aria-hidden
                />
                <span className="font-semibold tabular-nums">
                  {sellerTrust.publicAvg.toFixed(1)}
                </span>
                <span className="text-xs font-normal text-gray-500">
                  ({sellerTrust.ratingCount} reviews)
                </span>
              </p>
            ) : sellerTrust.ratingCount > 0 ? (
              <p className="mt-1 text-xs text-gray-500">
                Seller rating appears publicly after 10 reviews.
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">No reviews yet.</p>
            )}
          </div>
        ) : null}

        <p className="mt-2 text-xs text-gray-500">
          {product.stock <= 0
            ? "Out of stock"
            : product.stock <= 5
              ? "Low stock"
              : "In stock"}
        </p>

        {product.use_size_variants && (
          <div className="mt-6 anim-slide-in-bottom anim-delay-300">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Size
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PREDEFINED_SIZES.map((size) => {
                const available = Number(product.size_inventory?.[size] || 0);
                const disabled = available <= 0;
                const active = selectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedSize(size);
                      setQuantity((prev) => Math.min(prev, Math.max(1, available)));
                    }}
                    className={`min-h-[44px] min-w-[48px] rounded-full px-4 text-sm font-medium transition active:scale-95 disabled:opacity-40 ${
                      active
                        ? "bg-kuva-lavender text-gray-900"
                        : "bg-white text-gray-700 shadow-card hover:bg-kuva-surface"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-end gap-3 anim-slide-in-bottom anim-delay-400">
          {hasSale && (
            <p className="text-sm text-kuva-accent line-through">
              UGX {product.price_ugx.toLocaleString()}
            </p>
          )}
          <p className="text-2xl font-bold text-gray-900">
            UGX {finalPrice.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-4 anim-slide-in-bottom anim-delay-500">
          <span className="text-sm text-gray-500">Quantity</span>
          <div className="flex items-center gap-3 rounded-full bg-white px-2 py-1.5 shadow-card">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-kuva-surface active:scale-95 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={increaseQuantity}
              disabled={quantity >= product.stock}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-kuva-surface active:scale-95 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-6 anim-slide-in-bottom anim-delay-550">
          <h3 className="text-sm font-semibold text-gray-900">Description</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {product.description?.trim() || "No description provided for this product yet."}
          </p>
        </div>
      </div>

      <div className="fixed bottom-12 left-0 right-0 mx-auto max-w-md px-4 anim-slide-in-bottom anim-delay-600">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={selectedSizeStock === 0 || addingToCart || (product.use_size_variants && !selectedSize)}
          className="flex w-full min-h-[52px] items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 gap-2"
        >
          {addingToCart ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add to cart"
          )}
        </button>
      </div>
    </main>
  );
}

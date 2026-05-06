'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, Share2, ShoppingCart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { addToCart } from "@/app/actions/cart";
import { useNotification } from "@/app/context/NotificationContext";
import { addGuestCartItem, getGuestCartCount } from "@/utils/guestCart";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

interface Product {
  id: string;
  title: string;
  price_ugx: number;
  is_on_sale: boolean;
  sale_price_ugx: number | null;
  images: string[];
  stock: number;
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const { addNotification } = useNotification();

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase
        .from("products")
        .select("id, title, price_ugx, is_on_sale, sale_price_ugx, images, stock")
        .eq("id", params.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!data) {
        router.push("/not-found");
        return;
      }

      setProduct(data);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await addToCart(product.id, quantity);
        setCartCount((prev) => prev + 1);
      } else {
        addGuestCartItem(product.id, quantity);
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
    if (product && quantity < product.stock) {
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
          {hasSale && (
            <p className="text-sm text-kuva-accent line-through">
              UGX {product.price_ugx.toLocaleString()}
            </p>
          )}
          <p className="text-2xl font-bold text-gray-900">
            UGX {displayPrice.toLocaleString()}
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
      </div>

      <div className="fixed bottom-12 left-0 right-0 mx-auto max-w-md px-4 anim-slide-in-bottom anim-delay-600">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
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

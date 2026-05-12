"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Save, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { SoftDeleteProductButton } from "@/components/SoftDeleteProductButton";
import { PREDEFINED_SIZES } from "@/utils/productSizes";
import { MARKETPLACE_CATEGORIES, isKnownCategorySlug } from "@/lib/marketplaceCategories";
import { messageFromSupabaseError } from "@/lib/userFacingErrors";

const VENDOR_CATEGORY_OPTIONS = MARKETPLACE_CATEGORIES.map((c) => ({
  value: c.slug,
  label: c.label,
}));

export default function EditProductPage() {
  const params = useParams();
  const id = useMemo(() => {
    const raw = params.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.id]);

  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [useSizes, setUseSizes] = useState(false);
  const [useSamePriceForAllSizes, setUseSamePriceForAllSizes] = useState(true);
  const [sizeInventory, setSizeInventory] = useState<Record<string, string>>({});
  const [sizePrices, setSizePrices] = useState<Record<string, string>>({});
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setNotFound(true);
      return;
    }

    async function loadProduct() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setUnauthorized(true);
          return;
        }

        if (user.user_metadata?.role !== "vendor") {
          setUnauthorized(true);
          return;
        }

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .eq("vendor_id", user.id)
          .is("deleted_at", null)
          .maybeSingle();

        if (error) {
          console.error("[EditProduct] load", error);
          setNotFound(true);
          return;
        }

        if (!data) {
          setNotFound(true);
          return;
        }

        setTitle(data.title);
        setPrice(data.price_ugx.toString());
        setStock(data.stock.toString());
        setDescription(data.description || "");
        setUseSizes(Boolean(data.use_size_variants));
        setUseSamePriceForAllSizes(!Boolean(data.use_size_specific_prices));
        const inv = data.size_inventory || {};
        const prices = data.size_prices || {};
        const invState: Record<string, string> = {};
        const priceState: Record<string, string> = {};
        PREDEFINED_SIZES.forEach((size) => {
          if (inv[size] != null) invState[size] = String(inv[size]);
          if (prices[size] != null) priceState[size] = String(prices[size]);
        });
        setSizeInventory(invState);
        setSizePrices(priceState);
        setIsOnSale(Boolean(data.is_on_sale));
        setSalePrice(
          data.sale_price_ugx == null ? "" : data.sale_price_ugx.toString(),
        );
        const cat = data.category as string | null;
        setCategory(cat && isKnownCategorySlug(cat) ? cat : "");
      } catch (e) {
        console.error("[EditProduct] load unexpected", e);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError(null);
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.user_metadata?.role !== "vendor") {
        setUnauthorized(true);
        return;
      }

      const basePrice = parseFloat(price);
      const parsedSalePrice = salePrice.trim() ? parseFloat(salePrice) : NaN;
      if (Number.isNaN(basePrice) || basePrice <= 0) {
        setError("Enter a valid base price.");
        return;
      }
      if (isOnSale) {
        if (Number.isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
          setError("Enter a valid sale price.");
          return;
        }
        if (parsedSalePrice >= basePrice) {
          setError("Sale price must be lower than regular price.");
          return;
        }
      }

      const parsedSizeInventory: Record<string, number> = {};
      const parsedSizePrices: Record<string, number> = {};
      let computedStock = parseInt(stock, 10) || 0;

      if (useSizes) {
        computedStock = 0;
        for (const size of PREDEFINED_SIZES) {
          const qty = parseInt(sizeInventory[size] || "0", 10);
          if (qty > 0) {
            parsedSizeInventory[size] = qty;
            computedStock += qty;
          }
          if (!useSamePriceForAllSizes) {
            const value = parseFloat(sizePrices[size] || "");
            if (!Number.isNaN(value) && value > 0) {
              parsedSizePrices[size] = value;
            }
          }
        }
        if (computedStock <= 0) {
          setError("Enter stock for at least one size.");
          return;
        }
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          title,
          price_ugx: basePrice,
          stock: computedStock,
          description,
          use_size_variants: useSizes,
          use_size_specific_prices: useSizes && !useSamePriceForAllSizes,
          size_inventory: useSizes ? parsedSizeInventory : {},
          size_prices: useSizes && !useSamePriceForAllSizes ? parsedSizePrices : {},
          is_on_sale: isOnSale,
          sale_price_ugx: isOnSale ? parsedSalePrice : null,
          category: category || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("vendor_id", user.id)
        .is("deleted_at", null);

      if (updateError) {
        console.error("[EditProduct] update", updateError);
        setError(
          messageFromSupabaseError(
            updateError,
            "Could not save changes. Please try again."
          )
        );
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/vendor/dashboard");
      }, 1500);
    } catch (err) {
      console.error("[EditProduct] submit", err);
      setError("Something went wrong while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-6 text-center">
        <p className="text-gray-700">You do not have access to edit this product.</p>
        <Link
          href="/"
          className="mt-4 text-sm font-semibold text-primary underline"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (notFound || !id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-6 text-center">
        <p className="font-medium text-gray-900">Product not found</p>
        <p className="mt-1 text-sm text-gray-500">
          It may have been removed or you do not own this listing.
        </p>
        <Link
          href="/vendor/dashboard"
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-6 text-center">
        <CheckCircle className="anim-slide-in-bottom mb-4 h-16 w-16 text-green-500" />
        <h2 className="anim-slide-in-bottom anim-delay-100 mb-2 text-2xl font-bold text-gray-900">
          Saved!
        </h2>
        <p className="anim-slide-in-bottom anim-delay-200 text-gray-600">
          Product updated successfully.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-transparent pb-10">
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 py-4 anim-slide-in-bottom">
        <Link
          href="/vendor/dashboard"
          className="-ml-2 rounded-full p-2 text-gray-600 transition active:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Edit Product</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="anim-slide-in-bottom anim-delay-100 space-y-6 p-4"
      >
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product Title
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price (UGX)
              </label>
              <input
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock Amount
              </label>
              <input
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                disabled={useSizes}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Uncategorized</option>
              {VENDOR_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
            <label className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
              <span>Add size options (XS to XXL)</span>
              <input
                type="checkbox"
                checked={useSizes}
                onChange={(e) => setUseSizes(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
            </label>
            {useSizes && (
              <>
                <label className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
                  <span>Use same price for all sizes</span>
                  <input
                    type="checkbox"
                    checked={useSamePriceForAllSizes}
                    onChange={(e) => setUseSamePriceForAllSizes(e.target.checked)}
                    className="h-4 w-4 accent-black"
                  />
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {PREDEFINED_SIZES.map((size) => (
                    <div key={size} className="grid grid-cols-3 items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">{size}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={sizeInventory[size] || ""}
                        onChange={(e) =>
                          setSizeInventory((prev) => ({ ...prev, [size]: e.target.value }))
                        }
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
                      />
                      {!useSamePriceForAllSizes ? (
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="Price"
                          value={sizePrices[size] || ""}
                          onChange={(e) =>
                            setSizePrices((prev) => ({ ...prev, [size]: e.target.value }))
                          }
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">Base price</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <label className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
              <span>Enable sale price</span>
              <input
                type="checkbox"
                checked={isOnSale}
                onChange={(e) => setIsOnSale(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
            </label>
            {isOnSale && (
              <div className="mt-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sale Price (UGX)
                </label>
                <input
                  required={isOnSale}
                  type="number"
                  min="0"
                  step="100"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white shadow-md transition hover:bg-primary-dark active:scale-95 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <div className="border-t border-gray-200 px-4 pb-8 pt-6 anim-slide-in-bottom anim-delay-200">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">
          Remove from marketplace
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          Soft-deletes this listing: it stays in the database but buyers cannot
          see or purchase it. Use checkout validation to block stale cart lines.
        </p>
        <SoftDeleteProductButton productId={id} />
      </div>
    </main>
  );
}

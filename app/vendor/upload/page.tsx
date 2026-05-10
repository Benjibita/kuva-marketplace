"use client";

import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  CheckCircle,
  ArrowLeft,
  X,
  ImagePlus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PREDEFINED_SIZES } from "@/utils/productSizes";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplaceCategories";
import { ensureProfileRowExists } from "@/lib/ensureProfile";

const VENDOR_CATEGORY_OPTIONS = MARKETPLACE_CATEGORIES.map((c) => ({
  value: c.slug,
  label: c.label,
}));

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageFile {
  file: File;
  preview: string;
}

type SizeInventoryMap = Record<string, string>;
type SizePriceMap = Record<string, string>;

export default function VendorUpload() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [useSizes, setUseSizes] = useState(false);
  const [useSamePriceForAllSizes, setUseSamePriceForAllSizes] = useState(true);
  const [sizeInventory, setSizeInventory] = useState<SizeInventoryMap>({});
  const [sizePrices, setSizePrices] = useState<SizePriceMap>({});
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setError(null);

      const remaining = MAX_IMAGES - images.length;
      if (files.length > remaining) {
        setError(`You can only upload up to ${MAX_IMAGES} images total.`);
        return;
      }

      const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
      if (oversized) {
        setError(`"${oversized.name}" exceeds the 5MB limit.`);
        return;
      }

      const newImages: ImageFile[] = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...newImages]);
      // Reset input so the same file can be re-selected after removal
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [images.length]
  );

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to add a product.");
      }

      if (user.user_metadata?.role !== "vendor") {
        throw new Error("Only vendor accounts can list products.");
      }

      const { error: profileEnsureError } = await ensureProfileRowExists(
        supabase,
        user
      );
      if (profileEnsureError) {
        throw new Error(
          `Your seller profile is missing. Please log out and log in again, then retry. (${profileEnsureError.message})`
        );
      }

      const basePrice = parseFloat(price);
      const parsedSalePrice = salePrice.trim() ? parseFloat(salePrice) : NaN;
      if (Number.isNaN(basePrice) || basePrice <= 0) {
        throw new Error("Enter a valid base price.");
      }
      if (isOnSale) {
        if (Number.isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
          throw new Error("Enter a valid sale price.");
        }
        if (parsedSalePrice >= basePrice) {
          throw new Error("Sale price must be lower than the regular price.");
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
            const sizePrice = parseFloat(sizePrices[size] || "");
            if (!Number.isNaN(sizePrice) && sizePrice > 0) {
              parsedSizePrices[size] = sizePrice;
            }
          }
        }

        if (computedStock <= 0) {
          throw new Error("Enter stock for at least one size.");
        }
      }

      // 2. Upload images to Supabase Storage
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setUploadProgress(
          `Uploading image ${i + 1} of ${images.length}...`
        );

        const ext = img.file.name.split(".").pop() ?? "jpg";
        const filePath = `${user.id}/${Date.now()}_${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, img.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Failed to upload image "${img.file.name}": ${uploadError.message}`
          );
        }

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      // 3. Insert product into the database
      setUploadProgress("Saving product details...");

      const { error: insertError } = await supabase.from("products").insert({
        vendor_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        price_ugx: basePrice,
        stock: computedStock,
        category: category || null,
        use_size_variants: useSizes,
        use_size_specific_prices: useSizes && !useSamePriceForAllSizes,
        size_inventory: useSizes ? parsedSizeInventory : {},
        size_prices: useSizes && !useSamePriceForAllSizes ? parsedSizePrices : {},
        is_on_sale: isOnSale,
        sale_price_ugx: isOnSale ? parsedSalePrice : null,
        images: uploadedUrls,
        deleted_at: null,
      });

      if (insertError) {
        throw new Error(`Could not save product: ${insertError.message}`);
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  const handleReset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setTitle("");
    setPrice("");
    setStock("");
    setCategory("");
    setDescription("");
    setUseSizes(false);
    setUseSamePriceForAllSizes(true);
    setSizeInventory({});
    setSizePrices({});
    setIsOnSale(false);
    setSalePrice("");
    setError(null);
    setIsSuccess(false);
  };

  // ─── Success Screen ───────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-6 text-center">
        <div className="anim-slide-in-bottom mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>
        <h2 className="anim-slide-in-bottom anim-delay-100 mb-2 text-2xl font-bold text-gray-900">
          Product Listed!
        </h2>
        <p className="anim-slide-in-bottom anim-delay-150 mb-8 text-gray-500">
          Your product is now live on the KUVA marketplace.
        </p>
        <button
          onClick={handleReset}
          className="anim-slide-in-bottom anim-delay-200 mb-3 w-full rounded-xl bg-primary py-3.5 font-bold text-white transition active:scale-95"
        >
          Upload Another Product
        </button>
        <Link
          href="/vendor/dashboard"
          className="anim-slide-in-bottom anim-delay-250 block w-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm py-3.5 text-center font-bold text-gray-700 transition active:scale-95"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ─── Upload Form ──────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-transparent pb-12">
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 py-4 anim-slide-in-bottom">
        <Link
          href="/vendor/dashboard"
          className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Upload New Product</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="anim-slide-in-bottom anim-delay-100 space-y-5 p-4"
      >
        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Upload failed
              </p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Image Upload Area ── */}
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-800">
            Product Photos{" "}
            <span className="text-gray-400 font-normal">
              (up to {MAX_IMAGES})
            </span>
          </label>

          {/* Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add more slot */}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition"
                >
                  <ImagePlus className="w-5 h-5 mb-1" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
          )}

          {/* Empty state tap-to-upload */}
          {images.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-orange-50/50 transition group"
            >
              <UploadCloud className="w-10 h-10 text-gray-300 group-hover:text-primary mb-3 transition" />
              <p className="text-sm font-medium text-gray-600">
                Tap to add photos
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WEBP · Max 5MB each
              </p>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* ── Text Fields ── */}
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Title <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Handmade Leather Sandals"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition"
            />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (UGX) <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="number"
                min="0"
                step="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stock <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="1"
                disabled={useSizes}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition"
              />
            </div>
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
                    <div key={size} className="grid grid-cols-3 gap-2 items-center">
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
                <p className="text-xs text-gray-500">
                  Total stock is calculated from size quantities when size options are enabled.
                </p>
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Sale Price (UGX) <span className="text-red-400">*</span>
                </label>
                <input
                  required={isOnSale}
                  type="number"
                  min="0"
                  step="100"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition appearance-none"
            >
              <option value="">Select a category</option>
              {VENDOR_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product — material, size, use-case…"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition resize-none"
            />
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="pt-2">
          {isSubmitting && uploadProgress && (
            <p className="text-center text-sm text-gray-500 mb-3 animate-pulse">
              {uploadProgress}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md hover:bg-primary/90 transition active:scale-95 disabled:opacity-60 flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                List Product for Sale
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}

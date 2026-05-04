import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Flame, Package } from "lucide-react";

export interface Product {
  id: string;
  title: string;
  price_ugx: number;
  is_on_sale?: boolean | null;
  sale_price_ugx?: number | null;
  images: string[];
  category: string | null;
  stock: number;
  vendor?: {
    business_name: string | null;
  } | null;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasImage = product.images && product.images.length > 0;
  const isOutOfStock = product.stock === 0;
  const vendorName = product.vendor?.business_name?.trim() || "Local vendor";
  const hasSale =
    product.is_on_sale === true &&
    product.sale_price_ugx != null &&
    product.sale_price_ugx > 0 &&
    product.sale_price_ugx < product.price_ugx;
  const displayPrice = hasSale ? product.sale_price_ugx! : product.price_ugx;
  const discountPct = hasSale
    ? Math.round(((product.price_ugx - product.sale_price_ugx!) / product.price_ugx) * 100)
    : 0;
  const itemLabel =
    product.stock === 0 ? "Out of stock" : `${product.stock} items`;

  return (
    <Link
      href={`/products/${product.id}`}
      className={`group flex flex-col overflow-hidden rounded-5xl bg-white shadow-card transition hover:shadow-card-hover active:scale-[0.99] ${
        isOutOfStock ? "opacity-90" : ""
      }`}
    >
      <div className="relative aspect-[3/4] bg-kuva-surface">
        <div className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          {itemLabel}
        </div>
        {hasSale && (
          <div
            className="absolute right-3 top-3 z-10 flex min-h-8 min-w-8 items-center justify-center rounded-full bg-white/90 px-2 text-[11px] font-semibold text-kuva-accent shadow-sm backdrop-blur-sm"
            aria-label={`${discountPct}% off`}
          >
            <Flame className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
            -{discountPct}%
          </div>
        )}

        {hasImage ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <Package className="mb-1 h-10 w-10" strokeWidth={1.25} />
            <span className="text-xs">No image</span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 p-3.5">
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-gray-900">
            {product.title}
          </h4>
          <p className="mt-1 truncate text-[11px] font-normal leading-tight text-gray-500">
            {vendorName}
          </p>
          <div className="mt-1.5 flex items-end gap-2">
            <p className="text-base font-bold text-gray-900">
              UGX {displayPrice.toLocaleString()}
            </p>
            {hasSale && (
              <p className="text-[11px] text-gray-400 line-through">
                UGX {product.price_ugx.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kuva-surface text-gray-900 transition group-hover:bg-black group-hover:text-white"
          aria-hidden
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

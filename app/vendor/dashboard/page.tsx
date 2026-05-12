import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Package, Edit3, ClipboardList, ChevronRight, TrendingUp, AlertTriangle, Star } from 'lucide-react'
import { SoftDeleteProductButton } from '@/components/SoftDeleteProductButton'

type OrderItemWithOrder = {
  id: string
  quantity: number
  price_per_unit: number
  sale_price_per_unit: number | null
  orders: { status: string } | { status: string }[] | null
}

function orderStatusFromLine(line: OrderItemWithOrder): string | null {
  const o = line.orders
  if (!o) return null
  if (Array.isArray(o)) return o[0]?.status ?? null
  return o.status
}

function totalUnitsFromSizeInventory(inv: unknown): number {
  if (!inv || typeof inv !== 'object') return 0
  return Object.values(inv as Record<string, unknown>).reduce<number>(
    (sum, v) => sum + Math.max(0, Number(v) || 0),
    0
  )
}

function isLowStockProduct(p: {
  stock: number
  use_size_variants?: boolean | null
  size_inventory?: Record<string, number> | null
}): boolean {
  if (p.use_size_variants && p.size_inventory) {
    return totalUnitsFromSizeInventory(p.size_inventory) <= 5
  }
  return p.stock <= 5
}

export default async function VendorDashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== 'vendor') {
    redirect('/')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { data: salesLinesRaw } = await supabase
    .from('order_items')
    .select(
      `
      id,
      quantity,
      price_per_unit,
      sale_price_per_unit,
      orders ( status )
    `
    )
    .eq('vendor_id', user.id)

  const salesLines = (salesLinesRaw ?? []) as unknown as OrderItemWithOrder[]
  const counted = salesLines.filter((row) => {
    const st = orderStatusFromLine(row)
    return st === 'paid' || st === 'delivered'
  })

  const salesCount = counted.length
  const revenueUgx = counted.reduce((acc, row) => {
    const unit =
      row.sale_price_per_unit != null
        ? Number(row.sale_price_per_unit)
        : Number(row.price_per_unit)
    return acc + unit * row.quantity
  }, 0)

  const lowStockProducts =
    (products ?? []).filter((p) => isLowStockProduct(p as any)).slice(0, 6) ?? []

  const { count: unreadOrderCount } = await supabase
    .from('vendor_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', user.id)
    .eq('status', 'unread')

  const { data: ratingRows } = await supabase
    .from('vendor_ratings')
    .select('stars')
    .eq('vendor_id', user.id)

  const ratingCount = ratingRows?.length ?? 0
  const privateRatingAvg =
    ratingCount > 0
      ? ratingRows!.reduce((a, r) => a + Number(r.stars), 0) / ratingCount
      : null

  const { data: pubSummaryRaw } = await supabase.rpc(
    'public_vendor_rating_summary',
    { p_vendor_id: user.id }
  )
  const pubSummary = (
    pubSummaryRaw as { rating_count: number; average_stars: number | null }[] | null
  )?.[0]

  const message =
    typeof searchParams.message === 'string' ? searchParams.message : undefined
  const error =
    typeof searchParams.error === 'string' ? searchParams.error : undefined

  return (
    <main className="min-h-screen bg-transparent pb-20">
      <header className="sticky top-0 z-50 flex items-center justify-center border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 py-4 anim-slide-in-bottom">
        <h1 className="text-lg font-bold text-gray-900">Vendor Dashboard</h1>
      </header>

      <div className="space-y-6 p-4">
        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 anim-slide-in-bottom">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 anim-slide-in-bottom">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-sm p-6 shadow-sm anim-slide-in-bottom anim-delay-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.user_metadata.business_name || 'My Shop'}</h2>
            <p className="text-sm text-gray-500">{user.user_metadata.name}</p>
          </div>
          <Link href="/settings" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition">
            Edit Profile
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 anim-slide-in-bottom anim-delay-125">
          <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-medium uppercase text-gray-500">Sales (lines)</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{salesCount}</p>
            <p className="mt-1 text-[11px] text-gray-400">Paid or delivered orders</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
            <p className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
              Revenue
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">
              UGX {Math.round(revenueUgx).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">From your lines only</p>
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm anim-slide-in-bottom anim-delay-135">
            <p className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
              Low stock (≤5 units)
            </p>
            <ul className="mt-2 space-y-1 text-amber-950/90">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{p.title}</span>
                  <Link
                    href={`/vendor/edit-product/${p.id}`}
                    className="shrink-0 text-xs font-semibold underline"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 shadow-sm backdrop-blur-sm anim-slide-in-bottom anim-delay-150">
          <p className="text-xs font-medium uppercase text-gray-500">Customer ratings</p>
          {ratingCount === 0 ? (
            <p className="mt-2 text-sm text-gray-600">You don&apos;t have any ratings yet.</p>
          ) : (
            <>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold tabular-nums text-gray-900">
                {privateRatingAvg!.toFixed(1)}
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" aria-hidden />
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {ratingCount} verified review{ratingCount === 1 ? '' : 's'} (visible to you and
                support).
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                {pubSummary?.average_stars != null ? (
                  <>
                    Public average on listings:{' '}
                    <span className="font-semibold text-gray-900">
                      {pubSummary.average_stars.toFixed(1)} ★
                    </span>{' '}
                    ({pubSummary.rating_count} reviews).
                  </>
                ) : (
                  <>
                    Public average stays hidden until you reach 10 reviews ({ratingCount}
                    /10). Early scores stay private to avoid noisy averages.
                  </>
                )}
              </p>
            </>
          )}
        </div>

        <Link
          href="/vendor/orders"
          className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/85 px-5 py-4 shadow-sm backdrop-blur-sm transition hover:bg-white anim-slide-in-bottom anim-delay-200"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900">
                Orders from customers
              </span>
              <span className="block text-xs text-gray-500">
                Confirm, dispatch and complete fulfilment
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            {unreadOrderCount && unreadOrderCount > 0 ? (
              <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                {unreadOrderCount}
              </span>
            ) : null}
            <ChevronRight className="h-5 w-5 text-gray-400 transition group-hover:translate-x-0.5" />
          </span>
        </Link>

        <div className="flex items-center justify-between anim-slide-in-bottom anim-delay-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Product catalogue
          </h3>
          <Link 
            href="/vendor/upload" 
            className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product, i) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-4xl border border-gray-100 bg-white/85 backdrop-blur-sm shadow-sm anim-slide-in-bottom"
                style={{ animationDelay: `${250 + Math.min(i, 12) * 40}ms` }}
              >
                <div className="relative aspect-[3/4] bg-kuva-surface">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    <Link
                      href={`/vendor/edit-product/${product.id}`}
                      className="rounded-full bg-white/90 p-2 text-primary shadow-sm backdrop-blur-sm transition hover:bg-white"
                      aria-label="Edit product"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <SoftDeleteProductButton productId={product.id} compact />
                  </div>
                </div>

                <div className="p-3.5">
                  <h4 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-gray-900">
                    {product.title}
                  </h4>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
                    <span>Stock: {product.stock}</span>
                    <span className="font-semibold text-gray-900">
                      UGX {product.price_ugx.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/85 backdrop-blur-sm p-8 text-center anim-slide-in-bottom anim-delay-250">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">You haven&apos;t added any products yet.</p>
            <Link 
              href="/vendor/upload" 
              className="inline-block bg-primary text-white font-bold py-2 px-6 rounded-xl shadow-sm hover:bg-primary-dark transition"
            >
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

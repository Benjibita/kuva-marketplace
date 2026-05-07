import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Package, Edit3, ClipboardList } from 'lucide-react'
import { SoftDeleteProductButton } from '@/components/SoftDeleteProductButton'
import { VendorOrdersSection, type VendorOrderLineVM } from '@/components/VendorOrdersSection'
import { markVendorOrderNotificationsRead } from '@/app/actions/vendorOrders'

function buyerLabel(
  buyerId: string,
  profile?: { phone_number: string | null; business_name: string | null } | null
) {
  if (profile?.business_name) return profile.business_name
  if (profile?.phone_number) return profile.phone_number
  return `Customer (${buyerId.slice(0, 8)}…)`
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

  await markVendorOrderNotificationsRead()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { data: orderLines } = await supabase
    .from('order_items')
    .select(
      `
      id,
      quantity,
      vendor_status,
      size,
      created_at,
      order_id,
      orders (
        id,
        created_at,
        buyer_id
      ),
      products (
        title,
        images
      )
    `
    )
    .eq('vendor_id', user.id)
    .order('created_at', { ascending: false })

  const buyerIds = Array.from(
    new Set(
      (orderLines ?? [])
        .map((row) => {
          const o = row.orders as { buyer_id?: string } | null
          return o?.buyer_id
        })
        .filter((id): id is string => Boolean(id))
    )
  )

  let profileMap = new Map<
    string,
    { phone_number: string | null; business_name: string | null }
  >()
  if (buyerIds.length > 0) {
    const { data: buyerProfiles } = await supabase
      .from('profiles')
      .select('id, phone_number, business_name')
      .in('id', buyerIds)

    profileMap = new Map(
      (buyerProfiles ?? []).map((p) => [
        p.id,
        { phone_number: p.phone_number, business_name: p.business_name },
      ])
    )
  }

  const orderLinesVm: VendorOrderLineVM[] = (orderLines ?? []).map((l) => {
    const rawOrder = l.orders as unknown
    const order = (
      Array.isArray(rawOrder) ? rawOrder[0] : rawOrder
    ) as {
      id: string
      created_at: string
      buyer_id: string
    }
    const rawProduct = l.products as unknown
    const product = (
      Array.isArray(rawProduct) ? rawProduct[0] : rawProduct
    ) as { title: string; images: string[] | null }
    const prof = profileMap.get(order.buyer_id)
    return {
      id: l.id,
      quantity: l.quantity,
      vendor_status: l.vendor_status as string,
      size: l.size,
      order_id: order.id,
      order_created_at: order.created_at,
      buyer_label: buyerLabel(order.buyer_id, prof),
      product_title: product.title,
      product_image: product.images?.[0] ?? null,
    }
  })

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

        <div className="anim-slide-in-bottom anim-delay-150">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
            <ClipboardList className="h-5 w-5 text-primary" /> Orders from customers
          </h3>
          <VendorOrdersSection lines={orderLinesVm} />
        </div>

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

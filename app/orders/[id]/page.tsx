import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Package } from 'lucide-react'
import {
  customerStatusDisplay,
  isOrderFullyDelivered,
  vendorStatusToCustomer,
} from '@/utils/orderStatus'
import { CancelOrderButton } from '@/components/CancelOrderButton'
import { OrderDisputeForm } from '@/components/OrderDisputeForm'
import {
  VendorOrderRatingForms,
  type VendorRatingTarget,
} from '@/components/VendorOrderRatingForms'

type OrderItemRow = {
  id: string
  vendor_id: string
  quantity: number
  vendor_status: string | null
  buyer_status_seen: boolean | null
  size: string | null
  price_per_unit: number
  sale_price_per_unit: number | null
  products:
    | { title: string; images: string[] | null }
    | { title: string; images: string[] | null }[]
    | null
}

function lineProduct(line: OrderItemRow): {
  title: string
  images: string[] | null
} | null {
  const p = line.products
  if (!p) return null
  if (Array.isArray(p)) return p[0] ?? null
  return p
}

function contactLabel(
  id: string,
  profile?: { phone_number: string | null; business_name: string | null } | null
) {
  if (profile?.business_name) return profile.business_name
  if (profile?.phone_number) return profile.phone_number
  return `Seller (${id.slice(0, 8)}…)`
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/orders/${params.id}`)
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      created_at,
      total_amount,
      status,
      buyer_id,
      order_items (
        id,
        vendor_id,
        quantity,
        vendor_status,
        buyer_status_seen,
        size,
        price_per_unit,
        sale_price_per_unit,
        products (
          title,
          images
        )
      )
    `
    )
    .eq('id', params.id)
    .eq('buyer_id', user.id)
    .maybeSingle()

  if (error || !order) {
    notFound()
  }

  const items = (order.order_items ?? []) as unknown as OrderItemRow[]

  const [{ data: dispute }, { data: ratingsRows }] = await Promise.all([
    supabase
      .from('order_disputes')
      .select('message, created_at')
      .eq('order_id', params.id)
      .maybeSingle(),
    supabase
      .from('vendor_ratings')
      .select('vendor_id, stars, comment')
      .eq('order_id', params.id)
      .eq('buyer_id', user.id),
  ])

  const ratingsByVendor = new Map(
    (ratingsRows ?? []).map((r) => [
      r.vendor_id,
      { stars: r.stars, comment: r.comment },
    ])
  )

  const vendorIds = Array.from(
    new Set(items.map((i) => i.vendor_id).filter(Boolean))
  )

  let vendorProfileMap = new Map<
    string,
    { phone_number: string | null; business_name: string | null }
  >()
  if (vendorIds.length > 0) {
    const { data: vprof } = await supabase
      .from('profiles')
      .select('id, phone_number, business_name')
      .in('id', vendorIds)
    vendorProfileMap = new Map(
      (vprof ?? []).map((p) => [
        p.id,
        { phone_number: p.phone_number, business_name: p.business_name },
      ])
    )
  }

  const vendorsForRatings: VendorRatingTarget[] = vendorIds.map((vendorId) => ({
    vendorId,
    label: contactLabel(vendorId, vendorProfileMap.get(vendorId)),
    existing: ratingsByVendor.get(vendorId) ?? null,
  }))

  const fullyDelivered = isOrderFullyDelivered(
    items.map((i) => i.vendor_status)
  )

  const canOpenDisputeForm =
    (order.status === 'paid' || order.status === 'delivered') && !dispute

  const canCancel =
    order.status === 'paid' &&
    items.length > 0 &&
    items.every((i) => (i.vendor_status ?? 'received') === 'received')

  if (items.some((i) => i.buyer_status_seen === false)) {
    void supabase.rpc('mark_order_items_seen', { p_order_id: order.id })
  }
  const created = new Date(order.created_at).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return (
    <main className="min-h-screen bg-transparent pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-kuva-line/60 bg-white/40 px-3 py-3 backdrop-blur-md">
        <Link
          href="/orders"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-900 transition hover:bg-black/5"
          aria-label="Back to orders"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-11">
          Order details
        </h1>
      </header>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase text-gray-500">Order ID</p>
          <p className="font-mono text-sm text-gray-900">{order.id}</p>
          <p className="mt-3 text-xs font-medium uppercase text-gray-500">Placed</p>
          <p className="text-sm text-gray-800">{created}</p>
          <p className="mt-3 text-xs font-medium uppercase text-gray-500">Status</p>
          <p className="text-sm font-semibold capitalize text-gray-900">{order.status}</p>
          <p className="mt-3 text-xs font-medium uppercase text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">
            UGX {Number(order.total_amount).toLocaleString()}
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-gray-900">Items</h2>
          <ul className="space-y-3">
            {items.map((line) => {
              const cust = vendorStatusToCustomer(line.vendor_status)
              const unit =
                line.sale_price_per_unit != null
                  ? Number(line.sale_price_per_unit)
                  : Number(line.price_per_unit)
              const prod = lineProduct(line)
              const img = prod?.images?.[0]
              return (
                <li
                  key={line.id}
                  className="flex gap-3 rounded-2xl border border-gray-100 bg-white/85 p-3 backdrop-blur-sm"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-kuva-surface">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {prod?.title ?? 'Product'}
                      </p>
                      {line.buyer_status_seen === false ? (
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500"
                          title="Status updated"
                        />
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500">
                      Qty {line.quantity}
                      {line.size ? ` · Size ${line.size}` : ''}
                    </p>
                    <p className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {customerStatusDisplay(cust)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      UGX {(unit * line.quantity).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      UGX {unit.toLocaleString()} each
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {canCancel ? <CancelOrderButton orderId={order.id} /> : null}

        <OrderDisputeForm
          orderId={order.id}
          canSubmit={canOpenDisputeForm}
          existing={dispute}
        />

        {fullyDelivered ? (
          <VendorOrderRatingForms
            orderId={order.id}
            vendors={vendorsForRatings}
          />
        ) : null}
      </div>
    </main>
  )
}

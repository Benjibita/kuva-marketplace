import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Package } from 'lucide-react'
import {
  customerStatusDisplay,
  isOrderActive,
  isOrderFullyDelivered,
  vendorStatusToCustomer,
} from '@/utils/orderStatus'

type OrderItemRow = {
  id: string
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

type OrderRow = {
  id: string
  created_at: string
  total_amount: number
  order_items: OrderItemRow[] | null
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

export default async function OrdersPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/orders')
  }

  const { data: ordersRaw, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      created_at,
      total_amount,
      order_items (
        id,
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
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  const orders = (ordersRaw ?? []) as OrderRow[]

  // Render with current unseen state, then clear all dots so the next visit is quiet.
  const hasUnseen = orders.some((o) =>
    (o.order_items ?? []).some((i) => i.buyer_status_seen === false)
  )
  if (hasUnseen) {
    void supabase.rpc('mark_order_items_seen', { p_order_id: null }).then(() => {
      // best effort; RLS-scoped to current buyer via SECURITY DEFINER
    })
  }

  const activeOrders = orders.filter((o) => {
    const items = o.order_items ?? []
    if (items.length === 0) return false
    return isOrderActive(items.map((i) => i.vendor_status))
  })

  const historyOrders = orders.filter((o) => {
    const items = o.order_items ?? []
    if (items.length === 0) return false
    return isOrderFullyDelivered(items.map((i) => i.vendor_status))
  })

  return (
    <main className="min-h-screen bg-transparent pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-kuva-line/60 bg-white/40 px-3 py-3 backdrop-blur-md">
        <Link
          href="/settings"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-900 transition hover:bg-black/5"
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-11">
          My orders
        </h1>
      </header>

      <div className="space-y-8 p-4">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Active
          </h2>
          {activeOrders.length === 0 ? (
            <p className="rounded-2xl border border-gray-100 bg-white/85 px-4 py-8 text-center text-sm text-gray-500 backdrop-blur-sm">
              No active orders.
            </p>
          ) : (
            <ul className="space-y-3">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Order history
          </h2>
          {historyOrders.length === 0 ? (
            <p className="rounded-2xl border border-gray-100 bg-white/85 px-4 py-8 text-center text-sm text-gray-500 backdrop-blur-sm">
              Completed orders will appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {historyOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

function OrderCard({ order }: { order: OrderRow }) {
  const items = order.order_items ?? []
  const orderHasUnseen = items.some((i) => i.buyer_status_seen === false)
  const created = new Date(order.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <li className="overflow-hidden rounded-2xl border border-gray-100 bg-white/85 shadow-sm backdrop-blur-sm">
      <Link href={`/orders/${order.id}`} className="block px-4 py-3 transition hover:bg-black/[0.02]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {orderHasUnseen ? (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500"
                title="Status updated"
              />
            ) : null}
            <div>
              <p className="font-mono text-xs text-gray-500">
                {order.id.slice(0, 8)}…
              </p>
              <p className="text-xs text-gray-500">{created}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">
              UGX {Number(order.total_amount).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">{items.length} item(s)</p>
          </div>
        </div>
      </Link>
      <ul className="divide-y divide-gray-100 border-t border-gray-100">
        {items.map((line) => {
          const cust = vendorStatusToCustomer(line.vendor_status)
          const unit =
            line.sale_price_per_unit != null
              ? Number(line.sale_price_per_unit)
              : Number(line.price_per_unit)
          const prod = lineProduct(line)
          const img = prod?.images?.[0]
          return (
            <li key={line.id} className="flex gap-3 px-4 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-kuva-surface">
                {img ? (
                  <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 line-clamp-2">
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
                  {line.size ? ` · ${line.size}` : ''}
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {customerStatusDisplay(cust)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-gray-900">
                UGX {(unit * line.quantity).toLocaleString()}
              </p>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-gray-50 px-4 py-2 text-center">
        <Link
          href={`/orders/${order.id}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          View details
        </Link>
      </div>
    </li>
  )
}

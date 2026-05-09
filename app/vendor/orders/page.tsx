import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList } from 'lucide-react'
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

export default async function VendorOrdersPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== 'vendor') {
    redirect('/')
  }

  await markVendorOrderNotificationsRead()

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

  return (
    <main className="min-h-screen bg-transparent pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-kuva-line/60 bg-white/40 px-3 py-3 backdrop-blur-md">
        <Link
          href="/vendor/dashboard"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-900 transition hover:bg-black/5"
          aria-label="Back to vendor dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-11">
          Customer orders
        </h1>
      </header>

      <div className="space-y-4 p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
          <ClipboardList className="h-4 w-4 text-primary" />
          Active &amp; recent orders
        </h2>
        <VendorOrdersSection lines={orderLinesVm} />
      </div>
    </main>
  )
}

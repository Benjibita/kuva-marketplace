import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/admin'

export const metadata = {
  title: 'Order disputes · Admin',
}

export default async function AdminDisputesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin/disputes')
  }

  const expected = process.env.SUPPORT_ADMIN_EMAIL?.trim().toLowerCase()
  const actual = user.email?.trim().toLowerCase()
  if (!expected || !actual || actual !== expected) {
    redirect('/')
  }

  const admin = createServiceRoleClient()
  if (!admin) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <h1 className="text-lg font-bold text-gray-900">Order disputes</h1>
        <p className="mt-3 text-sm text-gray-600">
          Set <code className="rounded bg-gray-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
          on the server (never in the browser) so this page can list disputes. Your
          session is already verified against{' '}
          <code className="rounded bg-gray-100 px-1">SUPPORT_ADMIN_EMAIL</code>.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary underline">
          Back home
        </Link>
      </main>
    )
  }

  const { data: rows, error } = await admin
    .from('order_disputes')
    .select('id, order_id, buyer_id, message, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error(error)
  }

  return (
    <main className="mx-auto max-w-2xl p-6 pb-24">
      <h1 className="text-lg font-bold text-gray-900">Order disputes</h1>
      <p className="mt-1 text-xs text-gray-500">
        Buyers submit these from an order. Vendors see them on Customer orders.
      </p>

      {!rows?.length ? (
        <p className="mt-8 text-sm text-gray-500">No disputes yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <p className="font-mono text-xs text-gray-500">{r.id}</p>
              <p className="mt-2 text-xs text-gray-500">
                Order{' '}
                <span className="font-mono text-gray-800">{r.order_id}</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Buyer <span className="font-mono">{r.buyer_id}</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(r.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-900">{r.message}</p>
            </li>
          ))}
        </ul>
      )}

      <Link href="/" className="mt-8 inline-block text-sm font-semibold text-primary underline">
        Back home
      </Link>
    </main>
  )
}

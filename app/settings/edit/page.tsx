import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from '@/app/login/actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditSettingsPage({
  searchParams,
}: {
  searchParams?: { message?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { name, role } = user.user_metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, phone_number')
    .eq('id', user.id)
    .maybeSingle()

  const businessName = profile?.business_name || user.user_metadata?.business_name || ''
  const phoneNumber = profile?.phone_number || user.user_metadata?.phone_number || ''

  return (
    <main className="min-h-screen bg-transparent pb-20">
      <header className="sticky top-0 z-50 flex items-center border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 py-3 anim-slide-in-bottom">
        <Link href="/settings" className="mr-4 text-gray-700 transition hover:text-primary">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Account Details</h1>
      </header>

      <div className="mx-auto mt-6 max-w-2xl p-4">
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-sm p-6 shadow-sm anim-slide-in-bottom anim-delay-150">
          <p className="mb-4 text-sm text-gray-500">Update your profile details and save changes.</p>
          <form action={updateProfile} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Full Name</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
                type="text"
                name="name"
                defaultValue={name || ''}
                placeholder="Your full name"
                required
              />
            </div>
            {role === 'vendor' && (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Business Name</label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
                  type="text"
                  name="business_name"
                  defaultValue={businessName}
                  placeholder="Your business name"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Telephone Number</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
                type="tel"
                name="phone_number"
                defaultValue={phoneNumber}
                placeholder="+2567XXXXXXXX"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Accepted formats: 07XXXXXXXX, 2567XXXXXXXX, or +2567XXXXXXXX.
              </p>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.99]"
            >
              Save Account Details
            </button>
          </form>
          {searchParams?.message && (
            <p className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              {searchParams.message}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

import { createClient } from '@/utils/supabase/server'
import { SettingsDeleteAccountForm, SettingsLogoutForm } from '@/components/SettingsAccountForms'
import { Package, Pencil, User } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-transparent pb-20">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-center anim-slide-in-bottom">
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </header>

        <div className="max-w-2xl mx-auto p-4 mt-6">
          <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 anim-slide-in-bottom anim-delay-150">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 p-4 rounded-full text-primary">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create an account</h2>
                <p className="text-sm text-gray-500">Sign up to unlock profile tools and personalized shopping.</p>
              </div>
            </div>
            <div className="space-y-3">
              <Link
                href="/signup"
                className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.99]"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-white active:scale-[0.99]"
              >
                Sign In
              </Link>
              <Link
                href="/products"
                className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-white active:scale-[0.99]"
              >
                Continue Browsing
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const { name, role } = user.user_metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', user.id)
    .maybeSingle()
  const phoneNumber = profile?.phone_number || user.user_metadata?.phone_number || ''

  return (
    <main className="min-h-screen bg-transparent pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-center anim-slide-in-bottom">
        <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 mt-6">
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 anim-slide-in-bottom anim-delay-150">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-orange-100 p-4 rounded-full text-primary">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{name || 'KUVA User'}</h2>
              <p className="text-sm text-gray-500 capitalize">{role || 'Buyer'} Account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
              <p className="text-gray-900 font-medium mt-1">{user.email}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
              <p className="text-gray-900 font-medium mt-1">{name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Role</label>
              <p className="text-gray-900 font-medium mt-1 capitalize">{role || 'Buyer'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Telephone Number</label>
              <p className="text-gray-900 font-medium mt-1">{phoneNumber || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-sm p-6 shadow-sm anim-slide-in-bottom anim-delay-150">
          <Link
            href="/orders"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm py-3 px-4 text-sm font-semibold text-gray-800 transition hover:bg-white active:scale-[0.99]"
          >
            <Package className="h-5 w-5" strokeWidth={2} />
            My orders
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-sm p-6 shadow-sm anim-slide-in-bottom anim-delay-200">
          <Link
            href="/settings/edit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm py-3 px-4 text-sm font-semibold text-gray-800 transition hover:bg-white active:scale-[0.99]"
          >
            <Pencil className="h-5 w-5" strokeWidth={2} />
            Edit Account Details
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-sm p-6 shadow-sm anim-slide-in-bottom anim-delay-225">
          <SettingsLogoutForm />
        </div>

        <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-red-100 anim-slide-in-bottom anim-delay-300">
          <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <SettingsDeleteAccountForm />
        </div>
      </div>
    </main>
  )
}

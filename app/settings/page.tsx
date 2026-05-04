import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { deleteAccount, logout } from '@/app/login/actions'
import { ArrowLeft, LogOut, Trash2, User } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { name, role } = user.user_metadata

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center anim-slide-in-bottom">
        <Link href="/" className="mr-4 text-gray-700 hover:text-primary transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 anim-slide-in-bottom anim-delay-150">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-orange-100 p-4 rounded-full text-primary">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{name || 'Kuva User'}</h2>
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
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm anim-slide-in-bottom anim-delay-225">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 px-4 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.99]"
            >
              <LogOut className="h-5 w-5" strokeWidth={2} />
              Log out
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 anim-slide-in-bottom anim-delay-300">
          <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <form action={deleteAccount}>
            <button 
              type="submit" 
              className="flex items-center justify-center w-full py-3 px-4 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Account
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

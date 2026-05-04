import Link from 'next/link'
import { login } from './actions'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm anim-slide-in-bottom"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      <form className="flex flex-1 w-full flex-col justify-center gap-2 text-foreground">
        <div className="mb-6 flex flex-col items-center gap-2 text-center anim-slide-in-bottom anim-delay-100">
          <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to your Kuva account</p>
        </div>

        <label className="anim-slide-in-bottom anim-delay-150 text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          className="anim-slide-in-bottom anim-delay-200 mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
          name="email"
          required
        />
        <label className="anim-slide-in-bottom anim-delay-250 text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          className="anim-slide-in-bottom anim-delay-300 mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
          type="password"
          name="password"
          required
        />
        
        <button
          formAction={login}
          className="anim-slide-in-bottom anim-delay-400 mb-4 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
        >
          Sign In
        </button>

        {searchParams?.message && (
          <p className="anim-slide-in-bottom anim-delay-450 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {searchParams.message}
          </p>
        )}

        <div className="anim-slide-in-bottom anim-delay-500 mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  )
}

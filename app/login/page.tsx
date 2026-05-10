'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { login } from './actions'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [submitPending, setSubmitPending] = useState(false)

  useEffect(() => {
    setSubmitPending(false)
  }, [searchParams?.message])

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm anim-slide-in-bottom"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      <form
        className="flex flex-1 w-full flex-col justify-center gap-2 text-foreground"
        onSubmit={() => setSubmitPending(true)}
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center anim-slide-in-bottom anim-delay-100">
          <h1 className="text-3xl font-bold text-primary">Welcome to KUVA</h1>
          <p className="text-gray-500 text-sm">Sign in to your KUVA account</p>
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
        <div className="anim-slide-in-bottom anim-delay-300 relative mb-6">
          <input
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 transition focus:outline-none focus:ring-2 focus:ring-primary"
            type={showPassword ? 'text' : 'password'}
            name="password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        
        <button
          type="submit"
          formAction={login}
          disabled={submitPending}
          aria-busy={submitPending}
          className="anim-slide-in-bottom anim-delay-400 mb-4 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitPending ? (
            <>
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
              <span>Signing in…</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>

        {searchParams?.message && (
          <p className="anim-slide-in-bottom anim-delay-450 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {searchParams.message}
          </p>
        )}

        <div className="anim-slide-in-bottom anim-delay-500 mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  )
}

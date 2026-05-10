'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from '@/app/login/actions'
import { ArrowLeft, Eye, EyeOff, Loader2, ShoppingBag, Store } from 'lucide-react'

export default function SignupPage({
  searchParams,
}: {
  searchParams: { message?: string; next?: string }
}) {
  const [role, setRole] = useState<'buyer' | 'vendor' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [submitPending, setSubmitPending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setSubmitPending(false)
  }, [searchParams?.message])

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/login')
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <button
        type="button"
        onClick={() => {
          if (role) {
            setRole(null)
            return
          }
          goBack()
        }}
        className="anim-slide-in-bottom absolute left-8 top-8 z-50 flex items-center rounded-md bg-btn-background px-4 py-2 text-sm text-foreground no-underline hover:bg-btn-background-hover group"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      {!role ? (
        <div className="flex w-full flex-1 flex-col justify-center gap-6">
          <div className="anim-slide-in-bottom mb-4 flex flex-col items-center gap-2 text-center anim-delay-100">
            <h1 className="text-3xl font-bold text-primary">Join KUVA</h1>
            <p className="text-sm text-gray-500">How would you like to use our platform?</p>
          </div>

          <button
            onClick={() => setRole('buyer')}
            className="anim-slide-in-bottom anim-delay-200 flex items-center gap-4 rounded-2xl border-2 border-gray-100 bg-white p-6 text-left transition hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
          >
            <div className="bg-orange-50 p-3 rounded-full text-primary">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">I&apos;m a Buyer</h3>
              <p className="text-sm text-gray-500">I want to discover and buy local products.</p>
            </div>
          </button>

          <button
            onClick={() => setRole('vendor')}
            className="anim-slide-in-bottom anim-delay-300 flex items-center gap-4 rounded-2xl border-2 border-gray-100 bg-white p-6 text-left transition hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
          >
            <div className="bg-orange-50 p-3 rounded-full text-primary">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">I&apos;m a Vendor</h3>
              <p className="text-sm text-gray-500">I want to set up shop and sell my products.</p>
            </div>
          </button>

          <div className="anim-slide-in-bottom anim-delay-400 mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log In
            </Link>
          </div>
        </div>
      ) : (
        <form
          className="flex w-full flex-1 flex-col gap-2 py-6 text-foreground"
          onSubmit={() => setSubmitPending(true)}
        >
          <div className="anim-slide-in-bottom mb-6 flex min-h-[20vh] flex-col items-center justify-center gap-2 text-center anim-delay-75">
            <h1 className="text-3xl font-bold text-primary">Create Account</h1>
            <p className="text-gray-500 text-sm">
              Signing up as a <span className="font-bold capitalize text-gray-900">{role}</span>
            </p>
          </div>

          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="next" value={searchParams?.next || ''} />

          <label className="anim-slide-in-bottom anim-delay-100 text-sm font-medium" htmlFor="name">
            Full Name
          </label>
          <input
            className="anim-slide-in-bottom anim-delay-150 mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
            name="name"
            required
          />

          {role === 'vendor' && (
            <>
              <label className="anim-slide-in-bottom anim-delay-200 text-sm font-medium" htmlFor="business_name">
                Business Name
              </label>
              <input
                className="anim-slide-in-bottom anim-delay-225 mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
                name="business_name"
                required
              />
            </>
          )}

          <label className="anim-slide-in-bottom anim-delay-250 text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="anim-slide-in-bottom anim-delay-300 mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
            name="email"
            required
          />
          <label className="anim-slide-in-bottom anim-delay-325 text-sm font-medium" htmlFor="phone_number">
            Telephone Number
          </label>
          <input
            className="anim-slide-in-bottom anim-delay-350 mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
            type="tel"
            name="phone_number"
            placeholder="+2567XXXXXXXX"
            required
          />
          <p className="anim-slide-in-bottom anim-delay-360 -mt-3 mb-4 text-xs text-gray-500">
            Accepted formats: 07XXXXXXXX, 2567XXXXXXXX, or +2567XXXXXXXX.
          </p>
          <label className="anim-slide-in-bottom anim-delay-375 text-sm font-medium" htmlFor="password">
            Password
          </label>
          <div className="anim-slide-in-bottom anim-delay-425 relative mb-6">
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
            formAction={signup}
            disabled={submitPending}
            aria-busy={submitPending}
            className="anim-slide-in-bottom anim-delay-475 mb-4 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitPending ? (
              <>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                <span>Creating account…</span>
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          {searchParams?.message && (
            <p className="anim-slide-in-bottom anim-delay-500 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
              {searchParams.message}
            </p>
          )}
        </form>
      )}
    </div>
  )
}

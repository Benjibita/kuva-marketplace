'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/login/actions'
import { ArrowLeft, ShoppingBag, Store } from 'lucide-react'

export default function SignupPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const [role, setRole] = useState<'buyer' | 'vendor' | null>(null)

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <Link
        href={role ? "#" : "/login"}
        onClick={(e) => {
          if (role) {
            e.preventDefault();
            setRole(null);
          }
        }}
        className="anim-slide-in-bottom absolute left-8 top-8 flex items-center rounded-md bg-btn-background px-4 py-2 text-sm text-foreground no-underline hover:bg-btn-background-hover group"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      {!role ? (
        <div className="flex w-full flex-1 flex-col justify-center gap-6">
          <div className="anim-slide-in-bottom mb-4 flex flex-col items-center gap-2 text-center anim-delay-100">
            <h1 className="text-3xl font-bold text-primary">Join Kuva</h1>
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
              <h3 className="font-bold text-gray-900 text-lg">I'm a Buyer</h3>
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
              <h3 className="font-bold text-gray-900 text-lg">I'm a Vendor</h3>
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
        <form className="flex w-full flex-1 flex-col justify-center gap-2 text-foreground">
          <div className="anim-slide-in-bottom mb-6 flex flex-col items-center gap-2 text-center anim-delay-75">
            <h1 className="text-3xl font-bold text-primary">Create Account</h1>
            <p className="text-gray-500 text-sm">
              Signing up as a <span className="font-bold capitalize text-gray-900">{role}</span>
            </p>
          </div>

          <input type="hidden" name="role" value={role} />

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
          <label className="anim-slide-in-bottom anim-delay-350 text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="anim-slide-in-bottom anim-delay-400 mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
            type="password"
            name="password"
            required
          />
          
          <button
            formAction={signup}
            className="anim-slide-in-bottom anim-delay-450 mb-4 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            Sign Up
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

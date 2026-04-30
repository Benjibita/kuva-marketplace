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
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      {!role ? (
        <div className="animate-in fade-in flex-1 flex flex-col w-full justify-center gap-6">
          <div className="mb-4 flex flex-col gap-2 items-center text-center">
            <h1 className="text-3xl font-bold text-primary">Join Kuva</h1>
            <p className="text-gray-500 text-sm">How would you like to use our platform?</p>
          </div>

          <button
            onClick={() => setRole('buyer')}
            className="flex items-center gap-4 p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-primary/50 hover:shadow-md transition text-left active:scale-[0.98]"
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
            className="flex items-center gap-4 p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-primary/50 hover:shadow-md transition text-left active:scale-[0.98]"
          >
            <div className="bg-orange-50 p-3 rounded-full text-primary">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">I'm a Vendor</h3>
              <p className="text-sm text-gray-500">I want to set up shop and sell my products.</p>
            </div>
          </button>

          <div className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log In
            </Link>
          </div>
        </div>
      ) : (
        <form className="animate-in slide-in-from-right-4 fade-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
          <div className="mb-6 flex flex-col gap-2 items-center text-center">
            <h1 className="text-3xl font-bold text-primary">Create Account</h1>
            <p className="text-gray-500 text-sm">
              Signing up as a <span className="font-bold capitalize text-gray-900">{role}</span>
            </p>
          </div>

          <input type="hidden" name="role" value={role} />

          <label className="text-sm font-medium" htmlFor="name">
            Full Name
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 mb-4 focus:ring-2 focus:ring-primary focus:outline-none transition"
            name="name"
            required
          />

          {role === 'vendor' && (
            <>
              <label className="text-sm font-medium" htmlFor="business_name">
                Business Name
              </label>
              <input
                className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 mb-4 focus:ring-2 focus:ring-primary focus:outline-none transition"
                name="business_name"
                required
              />
            </>
          )}

          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 mb-4 focus:ring-2 focus:ring-primary focus:outline-none transition"
            name="email"
            required
          />
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 mb-6 focus:ring-2 focus:ring-primary focus:outline-none transition"
            type="password"
            name="password"
            required
          />
          
          <button
            formAction={signup}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition active:scale-[0.98] mb-4"
          >
            Sign Up
          </button>

          {searchParams?.message && (
            <p className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-center rounded-xl text-sm">
              {searchParams.message}
            </p>
          )}
        </form>
      )}
    </div>
  )
}

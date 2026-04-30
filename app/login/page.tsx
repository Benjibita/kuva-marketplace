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
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <div className="mb-6 flex flex-col gap-2 items-center text-center">
          <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to your Kuva account</p>
        </div>

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
          formAction={login}
          className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition active:scale-[0.98] mb-4"
        >
          Sign In
        </button>

        {searchParams?.message && (
          <p className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-center rounded-xl text-sm">
            {searchParams.message}
          </p>
        )}

        <div className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  )
}

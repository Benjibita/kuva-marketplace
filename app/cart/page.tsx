import Link from "next/link";
import { ArrowLeft, Minus, Plus } from "lucide-react";

/** Placeholder cart — checkout wiring comes later */
export default function CartPlaceholderPage() {
  return (
    <main className="min-h-screen bg-kuva-cream pb-32">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-kuva-line/80 bg-kuva-cream/90 px-4 py-3 backdrop-blur-md anim-slide-in-bottom">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-card transition active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <h1 className="text-base font-semibold text-gray-900">My Cart</h1>
        <span className="w-11" aria-hidden />
      </header>

      <div className="flex items-center justify-between px-4 pt-5 anim-slide-in-bottom anim-delay-100">
        <span className="text-sm text-gray-500">Total items</span>
        <span className="text-sm font-semibold text-gray-900">0 items</span>
      </div>

      <section className="mt-6 px-4 anim-slide-in-bottom anim-delay-200">
        <div className="rounded-4xl border border-dashed border-kuva-line bg-white/80 py-16 text-center">
          <p className="text-sm text-gray-500">Your cart is empty</p>
          <p className="mt-1 text-xs text-gray-400">
            Saved items and quantities will appear here.
          </p>
        </div>
      </section>

      <section className="mt-8 space-y-3 px-4 anim-slide-in-bottom anim-delay-300">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Sub total</span>
          <span className="font-medium text-gray-700">UGX 0</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Shipping</span>
          <span className="font-medium text-gray-700">—</span>
        </div>
        <div className="flex justify-between border-t border-kuva-line pt-3 text-base">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">UGX 0</span>
        </div>
      </section>

      <div className="fixed bottom-24 left-0 right-0 mx-auto max-w-md px-4 anim-slide-in-bottom anim-delay-400">
        <button
          type="button"
          disabled
          className="flex w-full min-h-[52px] items-center justify-center rounded-full bg-black text-sm font-semibold text-white opacity-40"
        >
          Checkout
        </button>
      </div>

      <p className="mt-6 px-4 text-center text-xs text-gray-400 anim-slide-in-bottom anim-delay-500">
        Quantity controls{" "}
        <span className="inline-flex items-center gap-1 align-middle">
          <Minus className="inline h-3 w-3" />
          <Plus className="inline h-3 w-3" />
        </span>{" "}
        will connect to your cart state.
      </p>
    </main>
  );
}

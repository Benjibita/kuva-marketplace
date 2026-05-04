import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProductsPlaceholderPage() {
  return (
    <main className="min-h-screen px-4 pb-28 pt-4">
      <header className="mb-8 flex items-center gap-3 anim-slide-in-bottom">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-card transition hover:bg-kuva-surface active:scale-95"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-gray-900">
          Browse
        </h1>
      </header>
      <div className="rounded-5xl bg-white p-8 text-center shadow-card anim-slide-in-bottom anim-delay-150">
        <p className="text-sm text-gray-500">
          Full catalog search and filters will live here. For now, discover
          products on the home feed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-black px-8 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] anim-slide-in-bottom anim-delay-300"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

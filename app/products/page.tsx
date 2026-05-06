import Link from "next/link";

export default function ProductsPlaceholderPage() {
  return (
    <main className="min-h-screen px-4 pb-28 pt-4">
      <header className="sticky top-0 z-40 flex items-center justify-center border-b border-kuva-line/60 bg-white/40 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-gray-900">Discover</h1>
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

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProductNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 pb-32 text-center">
      <p className="text-sm font-medium text-gray-900 anim-slide-in-bottom">
        Product not found
      </p>
      <p className="mt-1 text-sm text-gray-500 anim-slide-in-bottom anim-delay-100">
        It may have been removed or the link is incorrect.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98] anim-slide-in-bottom anim-delay-200"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to home
      </Link>
    </main>
  );
}

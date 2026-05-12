import { Loader2 } from "lucide-react";

export default function ProductsLoading() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4 pb-28 pt-16">
      <Loader2
        className="h-10 w-10 animate-spin text-gray-400"
        aria-label="Loading catalogue"
      />
      <p className="mt-3 text-sm text-gray-500">Loading products…</p>
    </main>
  );
}

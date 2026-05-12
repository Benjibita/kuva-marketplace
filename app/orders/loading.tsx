import { Loader2 } from "lucide-react";

export default function OrdersLoading() {
  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center px-4 pb-28 pt-12">
      <Loader2 className="h-9 w-9 animate-spin text-gray-400" aria-label="Loading orders" />
      <p className="mt-2 text-sm text-gray-500">Loading orders…</p>
    </main>
  );
}

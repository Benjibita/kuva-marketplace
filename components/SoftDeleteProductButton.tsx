"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { softDeleteProduct } from "@/app/vendor/actions";

type Props = {
  productId: string;
  /** Slightly shorter label when space is tight (e.g. dashboard row) */
  compact?: boolean;
};

export function SoftDeleteProductButton({ productId, compact }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        "Remove this product from the marketplace? It will stay in the database but buyers will no longer see or purchase it.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("productId", productId);
      await softDeleteProduct(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60 ${
        compact ? "p-2" : "gap-2 px-4 py-3 text-sm font-semibold"
      }`}
      aria-label={compact ? "Remove product from marketplace" : undefined}
    >
      <Trash2 className="h-5 w-5 shrink-0" strokeWidth={2} />
      {!compact && (pending ? "Removing…" : "Remove from marketplace")}
    </button>
  );
}

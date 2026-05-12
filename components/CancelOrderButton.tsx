"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cancelOrderAsBuyer } from "@/app/actions/orders";
import { useNotification } from "@/app/context/NotificationContext";
import { messageFromUnknownError } from "@/lib/userFacingErrors";

type Props = {
  orderId: string;
};

export function CancelOrderButton({ orderId }: Props) {
  const router = useRouter();
  const { addNotification } = useNotification();
  const [pending, startTransition] = useTransition();

  function onCancel() {
    if (
      !confirm(
        "Cancel this order? Your payment flow may still need a separate refund from support if money already moved."
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await cancelOrderAsBuyer(orderId);
        addNotification("Order cancelled. Stock has been returned to sellers.", "success");
        router.refresh();
      } catch (e) {
        addNotification(messageFromUnknownError(e, "Could not cancel order."), "error");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onCancel}
      disabled={pending}
      className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
          Cancelling…
        </>
      ) : (
        "Cancel order"
      )}
    </button>
  );
}

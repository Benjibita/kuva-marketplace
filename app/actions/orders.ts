"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  messageFromSupabaseError,
  USER_AUTH_REQUIRED,
} from "@/lib/userFacingErrors";

export async function cancelOrderAsBuyer(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(USER_AUTH_REQUIRED);
  }

  const { error } = await supabase.rpc("buyer_cancel_order_if_received", {
    p_order_id: orderId,
  });

  if (error) {
    const raw = (error.message || "").toLowerCase();
    if (raw.includes("fulfillment_started")) {
      throw new Error(
        "This order can no longer be cancelled because the seller has started fulfilment."
      );
    }
    if (raw.includes("order_not_cancellable")) {
      throw new Error("This order cannot be cancelled in its current state.");
    }
    if (raw.includes("not_buyer") || raw.includes("order_not_found")) {
      throw new Error("You cannot cancel this order.");
    }
    throw new Error(
      messageFromSupabaseError(error, "Could not cancel this order. Please try again.")
    );
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/vendor/dashboard");
  revalidatePath("/");
}

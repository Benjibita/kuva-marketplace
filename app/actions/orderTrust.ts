"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  messageFromSupabaseError,
  USER_AUTH_REQUIRED,
} from "@/lib/userFacingErrors";
import { notifyOrderDisputeSubmitted } from "@/services/email";

function normalizeDisputeMessage(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export async function submitOrderDispute(orderId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(USER_AUTH_REQUIRED);
  }

  const text = normalizeDisputeMessage(message);
  if (text.length < 20) {
    throw new Error("Please enter at least 20 characters so we can help.");
  }
  if (text.length > 4000) {
    throw new Error("Message is too long (max 4,000 characters).");
  }

  const { error } = await supabase.from("order_disputes").insert({
    order_id: orderId,
    buyer_id: user.id,
    message: text,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "A dispute or help request for this order was already submitted."
      );
    }
    throw new Error(
      messageFromSupabaseError(
        error,
        "Could not submit your request. Please try again."
      )
    );
  }

  void notifyOrderDisputeSubmitted({
    supportEmail: process.env.SUPPORT_ADMIN_EMAIL ?? null,
    orderId,
    buyerId: user.id,
    message: text,
  }).catch(() => {});

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/vendor/orders");
  revalidatePath("/admin/disputes");
}

export async function submitVendorRating(input: {
  orderId: string;
  vendorId: string;
  stars: number;
  comment: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(USER_AUTH_REQUIRED);
  }

  const stars = Math.round(Number(input.stars));
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    throw new Error("Please choose a rating from 1 to 5 stars.");
  }

  let comment: string | null = input.comment.trim();
  if (comment.length === 0) comment = null;
  if (comment && comment.length > 800) {
    throw new Error("Comment is too long (max 800 characters).");
  }

  const { error } = await supabase.from("vendor_ratings").insert({
    order_id: input.orderId,
    vendor_id: input.vendorId,
    buyer_id: user.id,
    stars,
    comment,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already rated this seller for this order.");
    }
    throw new Error(
      messageFromSupabaseError(
        error,
        "Could not save your rating. Please try again."
      )
    );
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${input.orderId}`);
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/orders");
}

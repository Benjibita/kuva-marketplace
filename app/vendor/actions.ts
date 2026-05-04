"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const DASHBOARD = "/vendor/dashboard";

/**
 * Soft-delete a product (sets deleted_at). Only the owning vendor may call this.
 * Redirects with query params for UX; `redirect()` throws — do not wrap in try/catch.
 */
export async function softDeleteProduct(formData: FormData) {
  const productId = formData.get("productId");
  const id = typeof productId === "string" ? productId.trim() : "";

  if (!id) {
    redirect(`${DASHBOARD}?error=${encodeURIComponent("Missing product")}`);
  }

  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      `/login?message=${encodeURIComponent("Sign in to manage products")}`,
    );
  }

  if (user.user_metadata?.role !== "vendor") {
    redirect(
      `/?error=${encodeURIComponent("Only vendors can remove products")}`,
    );
  }

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, vendor_id, deleted_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("[softDeleteProduct] fetch", fetchError);
    redirect(
      `${DASHBOARD}?error=${encodeURIComponent("Could not load product")}`,
    );
  }

  if (!product) {
    redirect(`${DASHBOARD}?error=${encodeURIComponent("Product not found")}`);
  }

  if (product.vendor_id !== user.id) {
    redirect(
      `${DASHBOARD}?error=${encodeURIComponent("You do not own this product")}`,
    );
  }

  if (product.deleted_at) {
    redirect(
      `${DASHBOARD}?message=${encodeURIComponent("This product was already removed from the marketplace")}`,
    );
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("products")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id)
    .eq("vendor_id", user.id)
    .is("deleted_at", null);

  if (updateError) {
    console.error("[softDeleteProduct] update", updateError);
    redirect(
      `${DASHBOARD}?error=${encodeURIComponent("Could not remove product")}`,
    );
  }

  revalidatePath(DASHBOARD);
  revalidatePath("/");
  revalidatePath(`/products/${id}`);

  redirect(
    `${DASHBOARD}?message=${encodeURIComponent("Product removed from marketplace")}`,
  );
}

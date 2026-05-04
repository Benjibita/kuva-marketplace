import type { SupabaseClient } from "@supabase/supabase-js";

export type CartLineForValidation = {
  productId: string;
  quantity: number;
};

export type CartValidationFailure =
  | { ok: false; code: "NOT_FOUND"; productId: string }
  | { ok: false; code: "DELETED"; productId: string }
  | { ok: false; code: "INSUFFICIENT_STOCK"; productId: string }
  | { ok: false; code: "STORE_ERROR" };

export type CartValidationResult = { ok: true } | CartValidationFailure;

/**
 * Use this on the server immediately before creating an order or charging payment.
 *
 * - Ensures every cart line points at a real product row.
 * - Rejects soft-deleted products (`deleted_at` set) so they are not purchasable
 *   even if a stale cart still references them.
 * - Rejects insufficient stock.
 *
 * Example (checkout route / server action):
 *
 * ```ts
 * const result = await assertCartProductsPurchasable(supabase, lines)
 * if (!result.ok) {
 *   if (result.code === 'DELETED') {
 *     return { error: 'One or more items are no longer available', removeProductId: result.productId }
 *   }
 *   ...
 * }
 * ```
 */
export async function assertCartProductsPurchasable(
  supabase: SupabaseClient,
  items: CartLineForValidation[],
): Promise<CartValidationResult> {
  if (items.length === 0) {
    return { ok: true };
  }

  const uniqueIds = Array.from(new Set(items.map((i) => i.productId)));

  const { data: rows, error } = await supabase
    .from("products")
    .select("id, stock, deleted_at")
    .in("id", uniqueIds);

  if (error) {
    console.error("[assertCartProductsPurchasable]", error);
    return { ok: false, code: "STORE_ERROR" };
  }

  const byId = new Map(rows?.map((r) => [r.id, r]) ?? []);

  for (const line of items) {
    const row = byId.get(line.productId);
    if (!row) {
      return { ok: false, code: "NOT_FOUND", productId: line.productId };
    }
    if (row.deleted_at != null) {
      return { ok: false, code: "DELETED", productId: line.productId };
    }
    if (row.stock < line.quantity) {
      return {
        ok: false,
        code: "INSUFFICIENT_STOCK",
        productId: line.productId,
      };
    }
  }

  return { ok: true };
}

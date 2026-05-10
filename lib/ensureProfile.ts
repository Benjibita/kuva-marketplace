import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Ensures `profiles` has a row for the signed-in user so FKs (e.g. products.vendor_id)
 * succeed. Call after login or before vendor actions if signup profile insert was blocked by RLS.
 */
export async function ensureProfileRowExists(
  supabase: SupabaseClient,
  user: User
): Promise<{ error: Error | null }> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: null };
  }

  const meta = user.user_metadata || {};
  const role =
    meta.role === "vendor" ? ("vendor" as const) : ("buyer" as const);

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    role,
    business_name:
      typeof meta.business_name === "string" && meta.business_name.trim()
        ? meta.business_name.trim()
        : null,
    phone_number:
      typeof meta.phone_number === "string" && meta.phone_number.trim()
        ? meta.phone_number.trim()
        : null,
  });

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

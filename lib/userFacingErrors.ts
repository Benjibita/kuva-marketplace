/** Maps Supabase / PostgREST errors to short, user-safe copy. */

export type SupabaseLikeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export const USER_AUTH_REQUIRED = "Please sign in to continue.";

export function messageFromSupabaseError(
  err: SupabaseLikeError | null | undefined,
  fallback = "Something went wrong. Please try again."
): string {
  if (!err) return fallback;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();

  if (
    code === "42501" ||
    msg.includes("permission denied") ||
    msg.includes("violates row-level security") ||
    msg.includes("new row violates row-level security")
  ) {
    return "You don't have permission to do that. Try signing in again.";
  }
  if (code === "23503" || msg.includes("foreign key constraint")) {
    return "This action could not be completed. Try refreshing the page or signing in again.";
  }
  if (code === "23505") {
    return "That value is already in use. Please choose something else.";
  }
  if (code === "PGRST116") {
    return "We couldn't find that item. It may have been removed.";
  }
  if (msg.includes("jwt") || msg.includes("invalid refresh") || msg.includes("session")) {
    return "Your session expired. Please sign in again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }
  return fallback;
}

/**
 * Prefer friendly copy for thrown Errors; keep concise domain messages (stock, cart).
 */
export function messageFromUnknownError(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!(err instanceof Error)) return fallback;
  const m = err.message;

  if (m === USER_AUTH_REQUIRED) return m;
  if (m === "Unauthorized") return USER_AUTH_REQUIRED;
  if (m.length <= 160 && !looksLikeRawDbError(m)) return m;

  return fallback;
}

function looksLikeRawDbError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("violates foreign key") ||
    lower.includes("violates row-level") ||
    lower.includes("permission denied for") ||
    lower.includes("duplicate key value")
  );
}

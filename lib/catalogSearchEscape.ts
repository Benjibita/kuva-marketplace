/** Escape `%` and `_` for safe use inside PostgREST `ilike` patterns. */
export function escapeIlikePattern(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

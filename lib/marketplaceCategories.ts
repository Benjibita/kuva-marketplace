/** Slugs match `products.category` / vendor upload values. */

export const MARKETPLACE_CATEGORIES = [
  { slug: "fashion", label: "Fashion & apparel", shopperShortLabel: "Fashion" },
  { slug: "crafts", label: "Crafts & art", shopperShortLabel: "Crafts" },
  { slug: "beauty", label: "Health & beauty", shopperShortLabel: "Beauty" },
  { slug: "electronics", label: "Electronics", shopperShortLabel: "Electronics" },
  { slug: "groceries", label: "Groceries & food", shopperShortLabel: "Groceries" },
  { slug: "home", label: "Home & living", shopperShortLabel: "Home" },
] as const;

export type MarketplaceCategorySlug =
  (typeof MARKETPLACE_CATEGORIES)[number]["slug"];

const SLUG_SET = new Set<string>(
  MARKETPLACE_CATEGORIES.map((c) => c.slug)
);

export function isKnownCategorySlug(
  value: string | undefined | null
): value is MarketplaceCategorySlug {
  return value != null && SLUG_SET.has(value);
}

export function getCategoryLabel(slug: string): string | null {
  const row = MARKETPLACE_CATEGORIES.find((c) => c.slug === slug);
  return row?.label ?? null;
}

export function getCategoryShopperShortLabel(slug: string): string | null {
  const row = MARKETPLACE_CATEGORIES.find((c) => c.slug === slug);
  return row?.shopperShortLabel ?? null;
}

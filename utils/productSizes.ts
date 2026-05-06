export const PREDEFINED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const

export type ProductSize = (typeof PREDEFINED_SIZES)[number]

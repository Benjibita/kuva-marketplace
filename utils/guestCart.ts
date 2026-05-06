const GUEST_CART_KEY = 'kuva_guest_cart'

export interface GuestCartItem {
  product_id: string
  selected_size?: string | null
  quantity: number
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getGuestCartItems(): GuestCartItem[] {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GuestCartItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item?.product_id && item?.quantity > 0)
  } catch {
    return []
  }
}

export function saveGuestCartItems(items: GuestCartItem[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

export function addGuestCartItem(productId: string, quantity: number, selectedSize?: string | null) {
  const current = getGuestCartItems()
  const normalizedSize = selectedSize || null
  const existing = current.find(
    (item) => item.product_id === productId && (item.selected_size || null) === normalizedSize
  )

  if (existing) {
    existing.quantity += quantity
    saveGuestCartItems(current)
    return
  }

  current.push({ product_id: productId, selected_size: normalizedSize, quantity })
  saveGuestCartItems(current)
}

export function updateGuestCartItemQuantity(productId: string, quantity: number, selectedSize?: string | null) {
  const current = getGuestCartItems()
  const normalizedSize = selectedSize || null
  const next = current
    .map((item) =>
      item.product_id === productId && (item.selected_size || null) === normalizedSize
        ? { ...item, quantity }
        : item
    )
    .filter((item) => item.quantity > 0)

  saveGuestCartItems(next)
}

export function removeGuestCartItem(productId: string, selectedSize?: string | null) {
  const current = getGuestCartItems()
  const normalizedSize = selectedSize || null
  const next = current.filter(
    (item) => !(item.product_id === productId && (item.selected_size || null) === normalizedSize)
  )
  saveGuestCartItems(next)
}

export function clearGuestCart() {
  if (!isBrowser()) return
  window.localStorage.removeItem(GUEST_CART_KEY)
}

export function getGuestCartCount() {
  return getGuestCartItems().reduce((sum, item) => sum + item.quantity, 0)
}

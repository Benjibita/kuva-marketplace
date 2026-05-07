'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useNotification } from '@/app/context/NotificationContext';
import {
  addToCart,
  getCartItems,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
} from '@/app/actions/cart';
import {
  addGuestCartItem,
  clearGuestCart,
  getGuestCartItems,
  removeGuestCartItem,
  updateGuestCartItemQuantity,
} from '@/utils/guestCart';
import { PREDEFINED_SIZES } from '@/utils/productSizes';

interface CartProduct {
  id: string;
  vendor_id?: string;
  title: string;
  price_ugx: number;
  is_on_sale: boolean;
  sale_price_ugx: number | null;
  use_size_variants?: boolean;
  use_size_specific_prices?: boolean;
  size_inventory?: Record<string, number>;
  size_prices?: Record<string, number>;
  images: string[];
  stock: number;
}

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  selected_size?: string | null;
  products: CartProduct;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [checkingOut, setCheckingOut] = useState(false);
  const [isGuestCart, setIsGuestCart] = useState(false);
  const router = useRouter();
  const { addNotification } = useNotification();
  const supabase = useMemo(() => createClient(), []);
  const [hasResumedCheckout, setHasResumedCheckout] = useState(false);

  useEffect(() => {
    async function fetchCart() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const guestItems = getGuestCartItems();
          if (guestItems.length > 0) {
            for (const item of guestItems) {
              try {
                await addToCart(item.product_id, item.quantity, item.selected_size || null);
              } catch {
                // Best effort migration from guest cart to account cart
              }
            }
            clearGuestCart();
          }

          const items = await getCartItems();
          setCartItems((items || []) as unknown as CartItem[]);
          setIsGuestCart(false);
          return;
        }

        const guestItems = getGuestCartItems();
        if (guestItems.length === 0) {
          setCartItems([]);
          setIsGuestCart(true);
          return;
        }

        const productIds = guestItems.map((item) => item.product_id);
        const { data: products } = await supabase
          .from('products')
          .select('id, vendor_id, title, price_ugx, is_on_sale, sale_price_ugx, use_size_variants, use_size_specific_prices, size_inventory, size_prices, images, stock')
          .in('id', productIds)
          .is('deleted_at', null);

        const productMap = new Map((products || []).map((product) => [product.id, product]));
        const hydrated = guestItems
          .map((item) => {
            const product = productMap.get(item.product_id);
            if (!product) return null;
            return {
              id: `guest-${item.product_id}-${item.selected_size || 'NO_SIZE'}`,
              quantity: Math.min(item.quantity, Number(item.selected_size ? (product.size_inventory?.[item.selected_size] || 0) : product.stock)),
              product_id: item.product_id,
              selected_size: item.selected_size || null,
              products: product,
            } as CartItem;
          })
          .filter((item): item is CartItem => item !== null && item.quantity > 0);

        setCartItems(hydrated);
        setIsGuestCart(true);
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCart();
  }, [supabase]);

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(cartItemId));
      const item = cartItems.find((cartItem) => cartItem.id === cartItemId);
      if (!item) return;

      if (isGuestCart) {
        removeGuestCartItem(item.product_id, item.selected_size || null);
      } else {
        await removeFromCart(cartItemId);
      }
      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
      addNotification('Item removed from cart', 'info');
    } catch (error) {
      addNotification(
        error instanceof Error ? error.message : 'Failed to remove item',
        'error'
      );
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handleUpdateQuantity = async (
    cartItemId: string,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(cartItemId);
      return;
    }

    try {
      setUpdatingIds((prev) => new Set(prev).add(cartItemId));
      const item = cartItems.find((cartItem) => cartItem.id === cartItemId);
      if (!item) return;

      if (isGuestCart) {
        updateGuestCartItemQuantity(item.product_id, newQuantity, item.selected_size || null);
      } else {
        await updateCartItemQuantity(cartItemId, newQuantity);
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      addNotification(
        error instanceof Error ? error.message : 'Failed to update quantity',
        'error'
      );
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const calculateItemTotal = (item: CartItem) => {
    const product = item.products;
    const sizePrice =
      item.selected_size && product.use_size_specific_prices
        ? Number(product.size_prices?.[item.selected_size] || 0)
        : null;
    const hasSale =
      product.is_on_sale &&
      product.sale_price_ugx &&
      product.sale_price_ugx > 0 &&
      product.sale_price_ugx < product.price_ugx;
    const unitPrice =
      sizePrice && sizePrice > 0
        ? sizePrice
        : hasSale
          ? product.sale_price_ugx!
          : product.price_ugx;
    return unitPrice * item.quantity;
  };

  const calculateSavings = (item: CartItem) => {
    const product = item.products;
    const hasSale =
      product.is_on_sale &&
      product.sale_price_ugx &&
      product.sale_price_ugx > 0 &&
      product.sale_price_ugx < product.price_ugx;
    if (!hasSale) return 0;
    return (product.price_ugx - product.sale_price_ugx!) * item.quantity;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalSavings = cartItems.reduce((sum, item) => sum + calculateSavings(item), 0);
  const shippingCost = cartItems.length > 0 ? 5000 : 0; // Mock shipping
  const total = subtotal + shippingCost;

  const handleSizeChange = async (cartItemId: string, selectedSize: string) => {
    const currentItem = cartItems.find((item) => item.id === cartItemId);
    if (!currentItem) return;

    const selected = selectedSize || null;
    const inventory = currentItem.products.size_inventory || {};
    const available = Number(inventory[selected || ''] || 0);
    if (selected && available < currentItem.quantity) {
      addNotification(`Only ${available} item(s) left for size ${selected}`, 'error');
      return;
    }

    if (isGuestCart) {
      removeGuestCartItem(currentItem.product_id, currentItem.selected_size || null);
      addGuestCartItem(currentItem.product_id, currentItem.quantity, selected);
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === cartItemId
            ? { ...item, selected_size: selected, id: `guest-${item.product_id}-${selected || 'NO_SIZE'}` }
            : item
        )
      );
      return;
    }

    try {
      setUpdatingIds((prev) => new Set(prev).add(cartItemId));
      await removeFromCart(cartItemId);
      await addToCart(currentItem.product_id, currentItem.quantity, selected);
      const refreshed = await getCartItems();
      setCartItems((refreshed || []) as unknown as CartItem[]);
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Failed to update size', 'error');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      addNotification('Your cart is empty', 'info');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const returnPath = encodeURIComponent('/cart?resumeCheckout=1');
      router.push(`/signup?next=${returnPath}&message=${encodeURIComponent('Create your account to complete checkout.')}`);
      return;
    }

    setCheckingOut(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          total,
          subtotal,
          shipping: shippingCost,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const { orderId } = await response.json();
      await clearCart();
      clearGuestCart();
      setCartItems([]);
      setIsGuestCart(false);
      addNotification(
        `✓ Purchase successful! Order ID: ${orderId.slice(0, 8)}...`,
        'success'
      );
      setTimeout(() => router.push('/'), 2000);
    } catch (error) {
      addNotification(
        error instanceof Error ? error.message : 'Checkout failed',
        'error'
      );
    } finally {
      setCheckingOut(false);
    }
  }, [cartItems, total, subtotal, shippingCost, supabase, router, addNotification]);

  useEffect(() => {
    async function resumeCheckoutIfNeeded() {
      if (loading || hasResumedCheckout || cartItems.length === 0) return;
      const resumeCheckout =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('resumeCheckout')
          : null;
      if (resumeCheckout !== '1') return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setHasResumedCheckout(true);
      addNotification('Account created. Resuming checkout...', 'success');
      await handleCheckout();
    }

    void resumeCheckoutIfNeeded();
  }, [loading, hasResumedCheckout, cartItems.length, supabase, addNotification, handleCheckout]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-kuva-accent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-40">
      <header className="sticky top-0 z-40 flex items-center justify-center border-b border-kuva-line/60 bg-white/40 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-gray-900">Cart</h1>
      </header>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <p className="text-lg font-semibold text-gray-900">Your cart is empty</p>
          <p className="mt-1 text-sm text-gray-500">
            Add items from the store to get started
          </p>
          <Link
            href="/"
            className="mt-6 min-h-[44px] min-w-[120px] rounded-full bg-black px-6 py-3 text-center text-sm font-semibold text-white transition active:scale-95"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="px-4 pt-4">
            <div className="space-y-3">
              {cartItems.map((item) => {
                const product = item.products;
                const imageUrl = product.images?.[0];
                const hasSale =
                  product.is_on_sale &&
                  product.sale_price_ugx &&
                  product.sale_price_ugx > 0 &&
                  product.sale_price_ugx < product.price_ugx;
                const unitPrice = hasSale
                  ? product.sale_price_ugx!
                  : product.price_ugx;
                const sizePrice =
                  item.selected_size && product.use_size_specific_prices
                    ? Number(product.size_prices?.[item.selected_size] || 0)
                    : null;
                const displayPrice = sizePrice && sizePrice > 0 ? sizePrice : unitPrice;
                const sizeStock =
                  item.selected_size && product.use_size_variants
                    ? Number(product.size_inventory?.[item.selected_size] || 0)
                    : product.stock;

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl bg-white p-3 shadow-card"
                  >
                    {/* Product Image */}
                    <Link
                      href={`/products/${product.id}`}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl"
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-kuva-surface text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </Link>

                    {/* Product Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link
                          href={`/products/${product.id}`}
                          className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-kuva-accent"
                        >
                          {product.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            UGX {displayPrice.toLocaleString()}
                          </p>
                          {hasSale && (
                            <p className="text-xs text-gray-500 line-through">
                              UGX {product.price_ugx.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity + Size Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 rounded-full bg-kuva-surface px-2 py-1">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={
                                updatingIds.has(item.id) || item.quantity <= 1
                              }
                              className="flex h-6 w-6 items-center justify-center text-gray-600 transition hover:bg-white active:scale-95 disabled:opacity-50"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" strokeWidth={2} />
                            </button>
                            <span className="min-w-[1.25rem] text-center text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={
                                updatingIds.has(item.id) ||
                                item.quantity >= sizeStock
                              }
                              className="flex h-6 w-6 items-center justify-center text-gray-600 transition hover:bg-white active:scale-95 disabled:opacity-50"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" strokeWidth={2} />
                            </button>
                          </div>

                          {product.use_size_variants && (
                            <select
                              value={item.selected_size || ''}
                              onChange={(e) => handleSizeChange(item.id, e.target.value)}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                            >
                              {PREDEFINED_SIZES.filter((size) => Number(product.size_inventory?.[size] || 0) > 0).map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingIds.has(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50 active:scale-95 disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Section */}
          <div className="px-4 pt-6 pb-24 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Subtotal</span>
              <span className="font-semibold text-gray-900">
                UGX {subtotal.toLocaleString()}
              </span>
            </div>

            {totalSavings > 0 && (
              <div className="flex justify-between text-xs text-kuva-accent">
                <span>You save</span>
                <span className="font-semibold">
                  UGX {totalSavings.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Shipping</span>
              <span className="font-semibold text-gray-900">
                {shippingCost > 0
                  ? `UGX ${shippingCost.toLocaleString()}`
                  : '—'}
              </span>
            </div>

            <div className="border-t border-gray-400/30 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="text-lg font-bold text-gray-900">
                UGX {total.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || checkingOut}
              className="flex w-full min-h-[52px] items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition hover:bg-gray-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 gap-2"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Checkout'
              )}
            </button>
          </div>
        </>
      )}
    </main>
  );
}

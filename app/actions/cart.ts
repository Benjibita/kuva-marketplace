'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addToCart(productId: string, quantity: number, selectedSize?: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Check if product exists and is not soft deleted
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, stock, title, use_size_variants, size_inventory')
    .eq('id', productId)
    .is('deleted_at', null)
    .single();

  if (productError || !product) {
    throw new Error('Product not found');
  }

  const normalizedSize = selectedSize || null;
  const sizeInventory = (product as any).size_inventory || {};
  const isSized = Boolean((product as any).use_size_variants);

  if (isSized) {
    if (!normalizedSize) {
      throw new Error('Please select a size');
    }
    const available = Number(sizeInventory[normalizedSize] || 0);
    if (available < quantity) {
      throw new Error(`Only ${available} item(s) left for size ${normalizedSize}`);
    }
  } else if (product.stock < quantity) {
    throw new Error('Insufficient stock');
  }

  // Check if item already in cart
  let existingItemQuery = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId);

  existingItemQuery = normalizedSize
    ? existingItemQuery.eq('selected_size', normalizedSize)
    : existingItemQuery.is('selected_size', null);

  const { data: existingItem } = await existingItemQuery.single();

  if (existingItem) {
    // Update quantity if item exists
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity, updated_at: new Date() })
      .eq('id', existingItem.id);

    if (updateError) {
      throw new Error('Failed to update cart');
    }
  } else {
    // Insert new cart item
    const { error: insertError } = await supabase.from('cart_items').insert({
      user_id: user.id,
      product_id: productId,
      selected_size: normalizedSize,
      quantity,
    });

    if (insertError) {
      throw new Error('Failed to add item to cart');
    }
  }

  revalidatePath('/cart');
  return { success: true, message: `${product.title} added to cart` };
}

export async function removeFromCart(cartItemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Verify item belongs to user
  const { data: cartItem } = await supabase
    .from('cart_items')
    .select('id')
    .eq('id', cartItemId)
    .eq('user_id', user.id)
    .single();

  if (!cartItem) {
    throw new Error('Cart item not found or unauthorized');
  }

  const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', cartItemId);

  if (deleteError) {
    throw new Error('Failed to remove item from cart');
  }

  revalidatePath('/cart');
  return { success: true, message: 'Item removed from cart' };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  // Verify item belongs to user and check product stock
  const { data: cartItem } = await supabase
    .from('cart_items')
    .select('id, product_id, products(stock)')
    .eq('id', cartItemId)
    .eq('user_id', user.id)
    .single();

  if (!cartItem) {
    throw new Error('Cart item not found or unauthorized');
  }

  const product = (cartItem as any).products;
  if (product.stock < quantity) {
    throw new Error(`Only ${product.stock} items available in stock`);
  }

  const { error: updateError } = await supabase
    .from('cart_items')
    .update({ quantity, updated_at: new Date() })
    .eq('id', cartItemId);

  if (updateError) {
    throw new Error('Failed to update quantity');
  }

  revalidatePath('/cart');
  return { success: true, message: 'Quantity updated' };
}

export async function getCartItems() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select(
      `
      id,
      quantity,
      product_id,
      selected_size,
      products (
        id,
        title,
        price_ugx,
        is_on_sale,
        sale_price_ugx,
        use_size_variants,
        use_size_specific_prices,
        size_inventory,
        size_prices,
        images,
        stock
      )
    `
    )
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch cart items');
  }

  return cartItems;
}

export async function clearCart() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    throw new Error('Failed to clear cart');
  }

  revalidatePath('/cart');
  return { success: true, message: 'Cart cleared' };
}

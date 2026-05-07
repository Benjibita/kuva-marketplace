'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/** Cart payload from client; product snapshot may be stale — always revalidated server-side */
interface CheckoutItem {
  id: string;
  product_id: string;
  selected_size?: string | null;
  quantity: number;
  products: {
    id: string;
    title: string;
    price_ugx: number;
    is_on_sale: boolean;
    sale_price_ugx: number | null;
    use_size_variants?: boolean;
    size_inventory?: Record<string, number>;
    stock: number;
  };
}

type DbProduct = {
  id: string;
  title: string;
  vendor_id: string;
  price_ugx: number;
  is_on_sale: boolean;
  sale_price_ugx: number | null;
  use_size_variants: boolean;
  size_inventory: Record<string, number>;
  stock: number;
};

export async function checkout(items: CheckoutItem[], total: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (!items.length) {
    throw new Error('Cart is empty');
  }

  // Load authoritative product rows (stock, vendor_id)
  const validated: { item: CheckoutItem; product: DbProduct }[] = [];

  for (const item of items) {
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select(
        'id, title, vendor_id, price_ugx, is_on_sale, sale_price_ugx, use_size_variants, size_inventory, stock'
      )
      .eq('id', item.product_id)
      .is('deleted_at', null)
      .single();

    if (prodErr || !product) {
      throw new Error(`Product not available: ${item.products?.title || item.product_id}`);
    }

    const sizeInventory =
      (product.size_inventory as Record<string, number> | null) || {};
    const useVariants = Boolean(product.use_size_variants);

    if (!useVariants) {
      if (product.stock < item.quantity) {
        throw new Error(
          `${product.title} does not have enough stock (${product.stock} available, requested ${item.quantity})`
        );
      }
    } else {
      const size = item.selected_size || '';
      const available = Number(sizeInventory[size] || 0);
      if (!size || available < item.quantity) {
        throw new Error(
          `${product.title} (${size || 'size'}) does not have enough stock (${available} available, requested ${item.quantity})`
        );
      }
    }

    validated.push({
      item,
      product: {
        ...product,
        use_size_variants: useVariants,
        size_inventory: sizeInventory,
      } as DbProduct,
    });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      total_amount: total,
      status: 'paid',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Order creation error details:', orderError);
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  if (!order) {
    throw new Error('Failed to create order: No order returned');
  }

  for (const { item, product } of validated) {
    const { error: orderItemError } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      vendor_id: product.vendor_id,
      size: item.selected_size || null,
      quantity: item.quantity,
      price_per_unit: product.price_ugx,
      sale_price_per_unit: product.is_on_sale ? product.sale_price_ugx : null,
    });

    if (orderItemError) {
      console.error('Order item creation error details:', orderItemError);
      throw new Error(`Failed to create order item: ${orderItemError.message}`);
    }

    const nextStock = product.stock - item.quantity;
    const updatePayload: Record<string, unknown> = {
      stock: Math.max(0, nextStock),
      updated_at: new Date().toISOString(),
    };

    if (product.use_size_variants && item.selected_size) {
      const sizeInventory = { ...product.size_inventory };
      const currentSizeStock = Number(sizeInventory[item.selected_size] || 0);
      sizeInventory[item.selected_size] = Math.max(
        0,
        currentSizeStock - item.quantity
      );
      updatePayload.size_inventory = sizeInventory;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', product.id);

    if (updateError) {
      throw new Error('Failed to update inventory');
    }
  }

  revalidatePath('/cart');
  revalidatePath('/orders');
  revalidatePath('/vendor/dashboard');

  return {
    success: true,
    orderId: order.id,
    message: 'Order placed successfully',
  };
}

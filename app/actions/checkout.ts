'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

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

export async function checkout(items: CheckoutItem[], total: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Validate items and check stock
  for (const item of items) {
    const product = item.products;
    if (product.stock < item.quantity) {
      if (!product.use_size_variants) {
        throw new Error(
          `${product.title} does not have enough stock (${product.stock} available, requested ${item.quantity})`
        );
      }
    }

    if (product.use_size_variants) {
      const size = item.selected_size || '';
      const sizeInventory = product.size_inventory || {};
      const available = Number(sizeInventory[size] || 0);
      if (!size || available < item.quantity) {
        throw new Error(
          `${product.title} (${size || 'size'}) does not have enough stock (${available} available, requested ${item.quantity})`
        );
      }
    }
  }

  // Create order
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

  // Insert order items and update inventory
  const notifications: {
    vendor_id: string;
    order_id: string;
    type: string;
    message: string;
    email_sent: boolean;
  }[] = [];
  const vendorEmails: Map<
    string,
    {
      vendor_id: string;
      email: string;
      vendor_name: string;
      items: {
        title: string;
        quantity: number;
        price: number;
      }[];
      total: number;
    }
  > = new Map();

  for (const item of items) {
    const product = item.products;
    const salePrice =
      product.is_on_sale && product.sale_price_ugx
        ? product.sale_price_ugx
        : product.price_ugx;

    // Insert order item
    const { error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        size: item.selected_size || null,
        quantity: item.quantity,
        price_per_unit: product.price_ugx,
        sale_price_per_unit: product.is_on_sale
          ? product.sale_price_ugx
          : null,
      });

    if (orderItemError) {
      console.error('Order item creation error details:', orderItemError);
      throw new Error(`Failed to create order item: ${orderItemError.message}`);
    }

    // Decrement inventory
    const nextStock = product.stock - item.quantity;
    const updatePayload: Record<string, unknown> = {
      stock: nextStock,
      updated_at: new Date(),
    };

    if (product.use_size_variants && item.selected_size) {
      const sizeInventory = { ...(product.size_inventory || {}) };
      const currentSizeStock = Number(sizeInventory[item.selected_size] || 0);
      sizeInventory[item.selected_size] = Math.max(0, currentSizeStock - item.quantity);
      updatePayload.size_inventory = sizeInventory;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', product.id);

    if (updateError) {
      throw new Error('Failed to update inventory');
    }

    // Get vendor details for notification
    const { data: vendorProfile } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', product.id)
      .single();

    if (vendorProfile?.vendor_id) {
      const { data: vendorData } = await supabase
        .from('profiles')
        .select('id, business_name, email:id->email')
        .eq('id', vendorProfile.vendor_id)
        .single();

      if (vendorData) {
        const vendorKey = vendorProfile.vendor_id;

        if (!vendorEmails.has(vendorKey)) {
          vendorEmails.set(vendorKey, {
            vendor_id: vendorProfile.vendor_id,
            email: '',
            vendor_name: vendorData.business_name || 'Vendor',
            items: [],
            total: 0,
          });
        }

        const vendorInfo = vendorEmails.get(vendorKey)!;
        vendorInfo.items.push({
          title: product.title,
          quantity: item.quantity,
          price: salePrice,
        });
        vendorInfo.total += salePrice * item.quantity;

        // Create in-app notification
        notifications.push({
          vendor_id: vendorProfile.vendor_id,
          order_id: order.id,
          type: 'order_placed',
          message: `New order: ${product.title} x${item.quantity}`,
          email_sent: false,
        });
      }
    }
  }

  // Insert vendor notifications
  for (const notification of notifications) {
    const { error: notifError } = await supabase
      .from('vendor_notifications')
      .insert(notification);

    if (notifError) {
      console.error('Failed to create notification:', notifError);
    }
  }

  // Send emails to vendors asynchronously (don't wait)
  Array.from(vendorEmails.values()).forEach(async (vendorInfo) => {
    try {
      // Get vendor email from auth
      const { data: vendorAuth } = await supabase.auth.admin.getUserById(
        vendorInfo.vendor_id
      );

      if (vendorAuth?.user?.email) {
        // Call email API endpoint
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/email`
          : 'http://localhost:3000/api/email';

        try {
          await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_vendor_email',
              vendor_email: vendorAuth.user.email,
              vendor_name: vendorInfo.vendor_name,
              order_id: order.id,
              items: vendorInfo.items,
              total: vendorInfo.total,
            }),
          });
        } catch (fetchError) {
          console.error('Failed to call email API:', fetchError);
        }

        // Mark notification as email sent
        try {
          await supabase
            .from('vendor_notifications')
            .update({
              email_sent: true,
              email_sent_at: new Date(),
            })
            .eq('order_id', order.id)
            .eq('vendor_id', vendorInfo.vendor_id);
        } catch (updateError) {
          console.error('Failed to update notification status:', updateError);
        }
      }
    } catch (error) {
      console.error('Failed to process vendor email:', error);
    }
  });

  revalidatePath('/cart');
  return {
    success: true,
    orderId: order.id,
    message: 'Order placed successfully',
  };
}

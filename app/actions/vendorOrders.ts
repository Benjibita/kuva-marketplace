'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { VendorOrderStatus } from '@/utils/orderStatus';

export async function markVendorOrderNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.user_metadata?.role !== 'vendor') {
    return;
  }

  await supabase
    .from('vendor_notifications')
    .update({ status: 'read', updated_at: new Date().toISOString() })
    .eq('vendor_id', user.id)
    .eq('status', 'unread');
}

export async function updateVendorOrderItemStatus(
  orderItemId: string,
  status: VendorOrderStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.user_metadata?.role !== 'vendor') {
    throw new Error('Unauthorized');
  }

  const allowed: VendorOrderStatus[] = ['received', 'dispatched', 'completed'];
  if (!allowed.includes(status)) {
    throw new Error('Invalid status');
  }

  const { error } = await supabase
    .from('order_items')
    .update({ vendor_status: status })
    .eq('id', orderItemId)
    .eq('vendor_id', user.id);

  if (error) {
    console.error(error);
    throw new Error('Failed to update order status');
  }

  revalidatePath('/vendor/dashboard');
  revalidatePath('/orders');
  return { success: true };
}

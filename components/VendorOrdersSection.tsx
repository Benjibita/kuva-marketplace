'use client';

import { useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  vendorStatusDisplay,
  type VendorOrderStatus,
} from '@/utils/orderStatus';
import { updateVendorOrderItemStatus } from '@/app/actions/vendorOrders';
import { ChevronDown, ShoppingBag } from 'lucide-react';

export type VendorOrderLineVM = {
  id: string;
  quantity: number;
  vendor_status: string;
  size: string | null;
  order_id: string;
  order_created_at: string;
  buyer_label: string;
  product_title: string;
  product_image: string | null;
};

const STATUS_OPTIONS: VendorOrderStatus[] = [
  'received',
  'dispatched',
  'completed',
];

export function VendorOrdersSection({
  lines,
}: {
  lines: VendorOrderLineVM[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const byOrder = lines.reduce<Record<string, VendorOrderLineVM[]>>(
    (acc, line) => {
      if (!acc[line.order_id]) acc[line.order_id] = [];
      acc[line.order_id].push(line);
      return acc;
    },
    {}
  );

  const orderIds = Object.keys(byOrder).sort((a, b) => {
    const ta = new Date(byOrder[b][0]?.order_created_at ?? 0).getTime();
    const tb = new Date(byOrder[a][0]?.order_created_at ?? 0).getTime();
    return ta - tb;
  });

  if (orderIds.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/85 p-8 text-center backdrop-blur-sm">
        <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p className="text-gray-500">No customer orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orderIds.map((orderId) => {
        const group = byOrder[orderId];
        const created = group[0]?.order_created_at;
        return (
          <div
            key={orderId}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white/85 shadow-sm backdrop-blur-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Order
                </p>
                <p className="font-mono text-sm text-gray-900">
                  {orderId.slice(0, 8)}…
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {created
                  ? new Date(created).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : ''}
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {group.map((line) => (
                <li
                  key={line.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-kuva-surface">
                    {line.product_image ? (
                      <Image
                        src={line.product_image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 line-clamp-2">
                      {line.product_title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Qty {line.quantity}
                      {line.size ? ` · Size ${line.size}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Customer: {line.buyer_label}
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <select
                      aria-label="Update fulfillment status"
                      disabled={isPending}
                      value={line.vendor_status}
                      onChange={(e) => {
                        const next = e.target.value as VendorOrderStatus;
                        startTransition(() => {
                          void updateVendorOrderItemStatus(line.id, next).then(
                            () => router.refresh()
                          );
                        });
                      }}
                      className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {vendorStatusDisplay(s)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

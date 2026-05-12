'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star } from 'lucide-react';
import { submitVendorRating } from '@/app/actions/orderTrust';
import { useNotification } from '@/app/context/NotificationContext';
import { messageFromUnknownError } from '@/lib/userFacingErrors';

export type VendorRatingTarget = {
  vendorId: string;
  label: string;
  existing: { stars: number; comment: string | null } | null;
};

function StarRow({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className="rounded-md p-1 transition hover:bg-primary/10 disabled:opacity-40"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star
              className={`h-7 w-7 ${active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              strokeWidth={active ? 0 : 1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

export function VendorOrderRatingForms({
  orderId,
  vendors,
}: {
  orderId: string;
  vendors: VendorRatingTarget[];
}) {
  const { addNotification } = useNotification();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  if (vendors.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-900">Rate your sellers</h2>
      <p className="text-xs text-gray-500">
        Shown after every item in this order is marked delivered. Star averages
        appear on listings only after a seller has received at least ten reviews.
      </p>
      {vendors.map((v) => (
        <VendorRatingCard
          key={v.vendorId}
          orderId={orderId}
          target={v}
          pendingKey={pendingKey}
          setPendingKey={setPendingKey}
          addNotification={addNotification}
        />
      ))}
    </div>
  );
}

function VendorRatingCard({
  orderId,
  target,
  pendingKey,
  setPendingKey,
  addNotification,
}: {
  orderId: string;
  target: VendorRatingTarget;
  pendingKey: string | null;
  setPendingKey: (k: string | null) => void;
  addNotification: (m: string, t: 'success' | 'error') => void;
}) {
  const router = useRouter();
  const [stars, setStars] = useState(target.existing?.stars ?? 0);
  const [comment, setComment] = useState(target.existing?.comment ?? '');
  const [, startTransition] = useTransition();
  const key = `${target.vendorId}-${orderId}`;
  const busy = pendingKey === key;

  if (target.existing) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 backdrop-blur-sm">
        <p className="text-sm font-semibold text-gray-900">{target.label}</p>
        <StarRow value={target.existing.stars} onChange={() => {}} disabled />
        {target.existing.comment ? (
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
            {target.existing.comment}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-gray-400">Thanks — your rating was saved.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 backdrop-blur-sm">
      <p className="text-sm font-semibold text-gray-900">{target.label}</p>
      <div className="mt-2">
        <StarRow
          value={stars}
          onChange={setStars}
          disabled={busy}
        />
      </div>
      <label className="mt-3 block text-xs font-medium uppercase text-gray-500">
        Optional comment
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={800}
        disabled={busy}
        className="mt-1 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="What stood out?"
      />
      <button
        type="button"
        disabled={busy || stars < 1}
        onClick={() => {
          startTransition(() => {
            setPendingKey(key);
            void submitVendorRating({
              orderId,
              vendorId: target.vendorId,
              stars,
              comment,
            })
              .then(() => {
                addNotification('Rating saved. Thank you!', 'success');
                router.refresh();
              })
              .catch((err) => {
                addNotification(messageFromUnknownError(err), 'error');
              })
              .finally(() => setPendingKey(null));
          });
        }}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          'Submit rating'
        )}
      </button>
    </div>
  );
}

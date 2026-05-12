'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { submitOrderDispute } from '@/app/actions/orderTrust';
import { useNotification } from '@/app/context/NotificationContext';
import { messageFromUnknownError } from '@/lib/userFacingErrors';

export function OrderDisputeForm({
  orderId,
  canSubmit,
  existing,
}: {
  orderId: string;
  canSubmit: boolean;
  existing: { message: string; created_at: string } | null;
}) {
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();
  const { addNotification } = useNotification();
  const router = useRouter();

  if (!canSubmit && !existing) {
    return null;
  }

  if (existing) {
    const when = new Date(existing.created_at).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 backdrop-blur-sm">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-950">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Dispute / help request sent
        </p>
        <p className="mt-1 text-xs text-amber-900/80">
          Submitted {when}. Support and sellers on this order have been notified in
          the app.
        </p>
        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-sm text-gray-800">
          {existing.message}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 backdrop-blur-sm">
      <h2 className="text-sm font-bold text-gray-900">Need help with this order?</h2>
      <p className="mt-1 text-xs text-gray-500">
        Describe the issue (min. 20 characters). This is sent to Kuva support and
        every seller involved in this order.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={4000}
        placeholder="What went wrong? Include anything that helps us resolve it."
        className="mt-3 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        disabled={pending}
      />
      <p className="mt-1 text-right text-xs text-gray-400">{text.trim().length} / 4000</p>
      <button
        type="button"
        disabled={pending || text.trim().length < 20}
        onClick={() => {
          startTransition(() => {
            void submitOrderDispute(orderId, text)
              .then(() => {
                setText('');
                addNotification('Your message was sent.', 'success');
                router.refresh();
              })
              .catch((err) => {
                addNotification(messageFromUnknownError(err), 'error');
              });
          });
        }}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          'Send to support & sellers'
        )}
      </button>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api/browser';
import { buildUploadPath, uploadToSupabaseStorage } from '@/lib/supabase/storage';
import type { OrderItem, OrderRecord } from '@/lib/orders/types';
import Button from '@/components/ui/Button';

const REASONS = [
  'Wrong item',
  'Wrong size/fit',
  'Damaged/defective',
  'Item not as described',
  'Missing item/part',
  'Other',
];

export default function ReturnChatbot({
  order,
  onClose,
  onSubmitted,
}: {
  order: OrderRecord;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [item, setItem] = useState<OrderItem | null>(order.items[0] || null);
  const [reason, setReason] = useState('');
  const [used, setUsed] = useState('');
  const [details, setDetails] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadToSupabaseStorage(file, buildUploadPath('returns', file.name));
        uploaded.push(url);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!reason || !used || !details.trim() || !images.length) {
      setError('Answer the questions and upload at least one photo.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiRequest('/api/returns', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          productId: item?.productId,
          productName: item?.productName,
          answers: { reason, used, details },
          images,
        }),
      });
      onSubmitted(`Return requested for ${order.orderNumber}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit return');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black">Return item</h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>
        <p className="text-xs text-gray-500">
          {order.orderNumber} · 7-day return window for delivered items
        </p>

        {step === 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Which item?</p>
            {order.items.map((entry, index) => (
              <button
                key={`${entry.productId}-${index}`}
                type="button"
                onClick={() => setItem(entry)}
                className={`w-full text-left p-3 rounded-xl border ${
                  item?.productId === entry.productId ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
              >
                {entry.productName} × {entry.quantity}
              </button>
            ))}
            <Button onClick={() => setStep(1)} disabled={!item}>Continue</Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Why are you returning it?</p>
            {REASONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setReason(option)}
                className={`w-full text-left p-3 rounded-xl border ${
                  reason === option ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
            <Button onClick={() => setStep(2)} disabled={!reason}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Was the item used?</p>
            {['No', 'Tried on only', 'Yes'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setUsed(option)}
                className={`w-full text-left p-3 rounded-xl border ${
                  used === option ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Briefly describe the issue"
              className="w-full border rounded-xl p-3 text-sm"
              rows={3}
            />
            <Button onClick={() => setStep(3)} disabled={!used || !details.trim()}>Continue</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Upload evidence photos</p>
            <input type="file" accept="image/*" multiple onChange={(e) => void uploadFiles(e.target.files)} />
            <div className="flex flex-wrap gap-2">
              {images.map((src) => (
                <div key={src} className="relative">
                  <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-black text-white rounded-full w-5 h-5 text-xs"
                    onClick={() => setImages((prev) => prev.filter((url) => url !== src))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={submit} disabled={busy || !images.length}>
              {busy ? 'Submitting…' : 'Submit return'}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

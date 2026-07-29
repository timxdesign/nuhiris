'use client';

import { useState } from 'react';
import { api } from '../lib/api-client';

interface BreakGlassModalProps {
  patientNuhi: string;
  onGranted: () => void;
  onCancel: () => void;
}

export function BreakGlassModal({ patientNuhi, onGranted, onCancel }: BreakGlassModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError('Please provide a detailed reason (at least 10 characters).');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api('/access/break-glass', {
        method: 'POST',
        body: JSON.stringify({ patientNuhi, reason: reason.trim() }),
      });
      onGranted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Break-glass request failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4" role="dialog" aria-modal="true" aria-labelledby="break-glass-title">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 id="break-glass-title" className="text-lg font-bold text-gray-900">Emergency Access (Break-Glass)</h2>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          This patient has not granted consent for you to access their records. Emergency access
          overrides consent and is <strong>immediately logged and reported to your supervisor</strong>.
        </p>

        <label htmlFor="break-glass-reason" className="mt-5 block text-sm font-medium text-gray-700">
          Reason for emergency access <span className="text-red-600">*</span>
        </label>
        <textarea
          id="break-glass-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={4}
          placeholder="e.g. Patient unconscious in emergency department, immediate access to allergy history required"
          className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel — go back
          </button>
          <button
            type="submit"
            disabled={submitting || reason.trim().length === 0}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Requesting…' : 'Request Emergency Access'}
          </button>
        </div>
      </form>
    </div>
  );
}

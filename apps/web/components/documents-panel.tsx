'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../hooks/use-auth';

interface DocumentRef {
  docId: string;
  encounterId: string | null;
  nuhi: string;
  docType: string;
  mimeType: string;
  fileSizeBytes: number | null;
  uploadedAt: string;
}

const UPLOAD_ROLES = ['medical_officer', 'nurse', 'lab_scientist', 'health_records_officer'];
const DOC_TYPES = ['discharge_summary', 'lab_report', 'referral_letter', 'imaging', 'other'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPanel({ nuhi, encounterId }: { nuhi: string; encounterId?: string }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]!);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const path = encounterId ? `/documents/encounter/${encounterId}` : `/documents/patient/${nuhi}`;
      const data = await api<DocumentRef[]>(path);
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [nuhi, encounterId]);

  useEffect(() => { void load(); }, [load]);

  const canUpload = user && UPLOAD_ROLES.includes(user.role);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('nuhi', nuhi);
      form.append('docType', docType);
      if (encounterId) form.append('encounterId', encounterId);
      await api('/documents/upload', { method: 'POST', body: form });
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: DocumentRef) => {
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${API_BASE}/documents/${doc.docId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.docType}-${doc.docId.slice(0, 8)}.${doc.mimeType.split('/')[1] ?? 'bin'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
        {canUpload && !showUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="rounded border border-[#075E54] px-3 py-1 text-xs font-medium text-[#075E54] hover:bg-[#E8F5E9]"
          >
            Upload document
          </button>
        )}
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="mt-3 space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-gray-700">
              Document type
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-700">
              File
              <input
                ref={fileRef}
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg"
                className="mt-1 w-full rounded-lg border border-gray-300 p-1.5 text-sm"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-2 text-sm text-gray-500">Loading documents…</p>
      ) : docs.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No documents on record.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {docs.map((d) => (
            <li key={d.docId} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <div>
                <p className="text-sm font-medium capitalize text-gray-900">{d.docType.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-500">
                  {new Date(d.uploadedAt).toLocaleDateString()} · {d.mimeType}
                  {d.fileSizeBytes ? ` · ${formatSize(d.fileSizeBytes)}` : ''}
                </p>
              </div>
              <button
                onClick={() => void handleDownload(d)}
                className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

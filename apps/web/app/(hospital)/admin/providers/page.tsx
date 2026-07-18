'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api-client';

interface Provider {
  providerId: string;
  fullName: string;
  licenceNumber: string;
  speciality: string;
  cadre: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
}

export default function ProvidersAdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await api<{ data: Provider[]; meta: { total: number } }>('/providers?limit=100');
        setProviders((result as unknown as { data: Provider[] })?.data ?? []);
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = providers.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.licenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.speciality.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Management</h1>
          <p className="mt-1 text-gray-500">Manage healthcare providers and their licences</p>
        </div>
      </div>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by name, licence, or speciality..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
        />
      </div>

      {loading ? (
        <div className="mt-8 text-gray-500">Loading providers...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 text-gray-500">No providers found.</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Licence #</th>
                <th className="px-4 py-3">Speciality</th>
                <th className="px-4 py-3">Cadre</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((p) => (
                <tr key={p.providerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.licenceNumber}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{p.speciality}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{p.cadre.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

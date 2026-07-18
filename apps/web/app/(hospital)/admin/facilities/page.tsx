'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api-client';

interface Facility {
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  facilityType: string;
  tier: string;
  state: string;
  lga: string;
  status: string;
  createdAt: string;
}

export default function FacilitiesAdminPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await api<{ data: Facility[]; meta: { total: number } }>('/facilities?limit=100');
        setFacilities((result as unknown as { data: Facility[] })?.data ?? []);
      } catch {
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = facilities.filter(
    (f) =>
      f.facilityName.toLowerCase().includes(search.toLowerCase()) ||
      f.facilityCode.toLowerCase().includes(search.toLowerCase()) ||
      f.state.toLowerCase().includes(search.toLowerCase()),
  );

  const tierColors: Record<string, string> = {
    primary: 'bg-blue-100 text-blue-700',
    secondary: 'bg-purple-100 text-purple-700',
    tertiary: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facility Management</h1>
          <p className="mt-1 text-gray-500">Manage registered healthcare facilities</p>
        </div>
      </div>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by name, code, or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
        />
      </div>

      {loading ? (
        <div className="mt-8 text-gray-500">Loading facilities...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 text-gray-500">No facilities found.</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">State / LGA</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((f) => (
                <tr key={f.facilityId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.facilityName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{f.facilityCode}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{f.facilityType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[f.tier] ?? 'bg-gray-100 text-gray-700'}`}>
                      {f.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f.state}, {f.lga}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {f.status}
                    </span>
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

'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api-client';

interface PatientResult {
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  state: string;
  status: string;
  phone: string | null;
}

export default function PatientsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const isNin = /^\d{11}$/.test(query);
      const params = isNin ? `nin=${query}` : `fullName=${encodeURIComponent(query)}`;
      const data = await api<[PatientResult[], number]>(`/patients/search?${params}`);
      setResults(Array.isArray(data) ? data[0] : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Patient Search</h1>
        <Link
          href="/patients/register"
          className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064e46]"
        >
          Register New Patient
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or NIN (11 digits)..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-[#075E54] px-6 py-2 font-medium text-white transition-colors hover:bg-[#064e46] disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searched && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-gray-500">No patients found.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">NUHI</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Date of Birth</th>
                    <th className="px-4 py-3">Sex</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((p) => (
                    <tr key={p.nuhi} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/patients/${p.nuhi}`}
                          className="inline-block rounded bg-[#E8F5E9] px-2 py-0.5 text-xs font-mono font-medium text-[#1B5E20]"
                        >
                          {p.nuhi.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.fullName}</td>
                      <td className="px-4 py-3 text-gray-600">{p.dateOfBirth}</td>
                      <td className="px-4 py-3 capitalize text-gray-600">{p.sex}</td>
                      <td className="px-4 py-3 text-gray-600">{p.state}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : p.status === 'provisional'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

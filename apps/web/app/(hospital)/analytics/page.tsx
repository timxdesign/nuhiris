'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api-client';

interface DailyStat {
  date: string;
  count: number;
}

interface AnalyticsSummary {
  registrations: {
    total: number;
    provisional: number;
    biometricVerified: number;
    upgradeRate: number;
    byState: { state: string; count: number }[];
    dailyTrend: DailyStat[];
  };
  encounters: {
    total: number;
    open: number;
    closed: number;
    byType: { type: string; count: number }[];
    dailyTrend: DailyStat[];
  };
  generatedAt: string;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
    </div>
  );
}

function BarList({ items, color }: { items: { label: string; count: number }[]; color: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 text-sm text-gray-600 capitalize">{item.label.replace(/_/g, ' ')}</span>
          <div className="flex-1">
            <div
              className="h-6 rounded"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: color,
                minWidth: '2px',
              }}
            />
          </div>
          <span className="w-12 text-right text-sm font-medium text-gray-700">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await api<AnalyticsSummary>(`/analytics/summary?days=${days}`);
        setData(result);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="p-8 text-gray-500">Failed to load analytics data.</div>;
  }

  const { registrations: reg, encounters: enc } = data;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-gray-500">System-wide statistics and trends</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                days === d
                  ? 'bg-[#075E54] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients" value={reg.total.toLocaleString()} />
        <StatCard label="Biometric Verified" value={reg.biometricVerified.toLocaleString()} sub={`${reg.upgradeRate}% upgrade rate`} />
        <StatCard label="Provisional" value={reg.provisional.toLocaleString()} />
        <StatCard label="Total Encounters" value={enc.total.toLocaleString()} sub={`${enc.open} open / ${enc.closed} closed`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Registrations by State</h3>
          <p className="mt-1 text-sm text-gray-500">Top 10 states</p>
          <div className="mt-4">
            <BarList
              items={reg.byState.map((s) => ({ label: s.state, count: s.count }))}
              color="#075E54"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Encounters by Type</h3>
          <p className="mt-1 text-sm text-gray-500">Breakdown of encounter types</p>
          <div className="mt-4">
            <BarList
              items={enc.byType.map((t) => ({ label: t.type, count: t.count }))}
              color="#1B5E20"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Daily Registrations</h3>
          <div className="mt-4 flex items-end gap-1" style={{ height: 120 }}>
            {reg.dailyTrend.map((d) => {
              const max = Math.max(...reg.dailyTrend.map((x) => x.count), 1);
              return (
                <div
                  key={d.date}
                  className="flex-1 rounded-t bg-[#075E54]"
                  style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }}
                  title={`${d.date}: ${d.count}`}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Daily Encounters</h3>
          <div className="mt-4 flex items-end gap-1" style={{ height: 120 }}>
            {enc.dailyTrend.map((d) => {
              const max = Math.max(...enc.dailyTrend.map((x) => x.count), 1);
              return (
                <div
                  key={d.date}
                  className="flex-1 rounded-t bg-[#1B5E20]"
                  style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }}
                  title={`${d.date}: ${d.count}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

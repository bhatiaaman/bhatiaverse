'use client';
import { useMemo } from 'react';
import { Save } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN')}`;
}

function fmtCr(n) {
  const v = Number(n) / 1e7;
  return `₹${v.toFixed(2)}Cr`;
}

// Future value of SIP: FV = PMT × ((1+r)^n − 1) / r
function sipFV(monthly, annualRate, months) {
  const r = (Number(annualRate) || 12) / 1200;
  const n = Number(months) || 0;
  const p = Number(monthly) || 0;
  if (!p || !n) return 0;
  if (r === 0) return p * n;
  return Math.round(p * ((Math.pow(1 + r, n) - 1) / r));
}

// Months since start date
function monthsSince(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now   = new Date();
  return Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24 * 30.44)));
}

const SIP_CATEGORIES = ['Equity', 'Debt', 'Hybrid', 'Gold', 'International', 'Other'];
const COLORS = { Equity: '#6366f1', Debt: '#22d3ee', Hybrid: '#a78bfa', Gold: '#fbbf24', International: '#34d399', Other: '#94a3b8' };
const INPUT = 'w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-violet-400/40 focus:outline-none';

export default function SIPSection({ sip, setSip, onSave, saveState }) {
  const addSIP = () => setSip((prev) => ({
    ...prev,
    items: [...(prev.items || []), {
      id: Date.now(), fundName: '', amount: 0, category: 'Equity',
      startDate: '', xirr: 12, currentValue: 0, notes: '',
    }],
  }));

  const upd = (id, field, value) => setSip((prev) => ({
    ...prev,
    items: (prev.items || []).map((s) => s.id === id ? { ...s, [field]: value } : s),
  }));

  const rem = (id) => setSip((prev) => ({ ...prev, items: (prev.items || []).filter((s) => s.id !== id) }));

  const totals = useMemo(() => {
    return (sip.items || []).reduce((acc, s) => {
      const months   = monthsSince(s.startDate);
      const invested = (Number(s.amount) || 0) * months;
      acc.monthly  += Number(s.amount) || 0;
      acc.invested += invested;
      acc.current  += Number(s.currentValue) || 0;
      return acc;
    }, { monthly: 0, invested: 0, current: 0 });
  }, [sip]);

  // 10-year projection data for chart
  const projectionData = useMemo(() => {
    const items = sip.items || [];
    if (!items.length) return [];
    return Array.from({ length: 11 }, (_, yr) => {
      const n = yr * 12;
      let invested = 0, projected = 0;
      items.forEach((s) => {
        const alreadyInvested = monthsSince(s.startDate);
        const monthsAhead = n;
        const totalMonths  = alreadyInvested + monthsAhead;
        const totalInvested = (Number(s.amount) || 0) * totalMonths;
        const fv = sipFV(s.amount, s.xirr, totalMonths);
        invested  += totalInvested;
        projected += fv;
      });
      return {
        year: `Y${yr}`,
        invested: Math.round(invested),
        value: Math.round(projected),
      };
    });
  }, [sip]);

  // Category breakdown
  const byCategory = useMemo(() => {
    const map = {};
    (sip.items || []).forEach((s) => {
      const cat = s.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(s.amount) || 0);
    });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [sip]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <div className="font-semibold text-gray-300 mb-1">{label}</div>
        {payload.map((p) => (
          <div key={p.name} className="flex gap-2 items-center">
            <span style={{ color: p.color }}>●</span>
            <span className="text-gray-400">{p.name}:</span>
            <span className="text-white font-medium">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📈</span> SIP Tracker
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Track all SIPs, see portfolio growth projection.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={addSIP}
            className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
            + Add SIP
          </button>
          <button type="button" onClick={onSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-400/40 text-violet-200 hover:bg-violet-500/25 transition-colors text-sm">
            <Save size={14} /> Save
          </button>
          {saveState.status !== 'idle' && (
            <span className={saveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{saveState.message}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {(sip.items || []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { l: 'Monthly SIP', v: fmt(totals.monthly), color: 'text-violet-300' },
            { l: 'Total Invested', v: fmt(Math.round(totals.invested)), color: 'text-blue-300' },
            { l: 'Current Value', v: fmt(totals.current), color: totals.current >= totals.invested ? 'text-emerald-300' : 'text-red-300' },
          ].map(({ l, v, color }) => (
            <div key={l} className="p-4 rounded-2xl bg-slate-900/50 border border-white/10">
              <div className="text-xs text-gray-500 mb-1">{l}</div>
              <div className={`text-xl font-bold ${color}`}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* 10-year projection chart */}
      {projectionData.length > 0 && totals.monthly > 0 && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">10-Year Portfolio Projection</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={projectionData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="sipInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sipValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tickFormatter={(v) => v >= 1e7 ? `${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v / 1e5).toFixed(0)}L` : v}
                tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Area type="monotone" dataKey="invested" name="Invested" stroke="#6366f1" fill="url(#sipInvested)" strokeWidth={2} />
              <Area type="monotone" dataKey="value" name="Projected Value" stroke="#34d399" fill="url(#sipValue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category allocation */}
      {byCategory.length > 1 && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Allocation by Category</h3>
          <div className="space-y-2">
            {byCategory.map(({ name, amount }) => {
              const pct = totals.monthly > 0 ? Math.round((amount / totals.monthly) * 100) : 0;
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs w-24 text-gray-400">{name}</span>
                  <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[name] || '#94a3b8' }} />
                  </div>
                  <span className="text-xs text-gray-400 w-20 text-right">{fmt(amount)}/mo</span>
                  <span className="text-xs text-gray-600 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SIP list */}
      {(sip.items || []).length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm bg-slate-900/30 border border-white/5 rounded-2xl">
          No SIPs added. Click &quot;+ Add SIP&quot; to start tracking.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(sip.items || []).map((s) => {
            const months    = monthsSince(s.startDate);
            const invested  = (Number(s.amount) || 0) * months;
            const fv10      = sipFV(s.amount, s.xirr, months + 120); // 10y from now
            const gainPct   = invested > 0 && s.currentValue > 0
              ? Math.round(((Number(s.currentValue) - invested) / invested) * 100)
              : 0;
            return (
              <div key={s.id} className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input value={s.fundName} onChange={(e) => upd(s.id, 'fundName', e.target.value)}
                      placeholder="Fund name"
                      className="w-full font-semibold text-sm bg-transparent border-b border-transparent hover:border-white/20 focus:border-violet-400/40 focus:outline-none text-white min-w-0 py-0.5" />
                    <div className="flex items-center gap-2 mt-1">
                      <select value={s.category} onChange={(e) => upd(s.id, 'category', e.target.value)}
                        className="text-xs bg-slate-800 border border-white/10 rounded-lg px-2 py-0.5 text-gray-400">
                        {SIP_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <span className="text-xs text-gray-600">{months > 0 ? `${months}m ago` : 'Not started'}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => rem(s.id)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Monthly (₹)', field: 'amount', type: 'number' },
                    { label: 'Expected XIRR %', field: 'xirr', type: 'number', step: '0.1' },
                    { label: 'Start Date', field: 'startDate', type: 'date' },
                    { label: 'Current Value (₹)', field: 'currentValue', type: 'number' },
                  ].map(({ label, field, type, step }) => (
                    <label key={field} className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">{label}</span>
                      <input type={type} step={step} value={s[field] ?? (type === 'number' ? 0 : '')}
                        onChange={(e) => upd(s.id, field, e.target.value)}
                        className="px-2 py-1.5 bg-slate-900/60 border border-white/10 rounded-lg text-xs focus:border-violet-400/40 focus:outline-none text-gray-300" />
                    </label>
                  ))}
                </div>

                {invested > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-800/50 border border-white/5">
                      <div className="text-gray-500">Invested so far</div>
                      <div className="font-semibold text-blue-300 mt-0.5">{fmt(Math.round(invested))}</div>
                    </div>
                    {fv10 > 0 && (
                      <div className="p-2 rounded-lg bg-slate-800/50 border border-white/5">
                        <div className="text-gray-500">10y projected</div>
                        <div className="font-semibold text-emerald-300 mt-0.5">{fv10 >= 1e7 ? fmtCr(fv10) : fmt(fv10)}</div>
                      </div>
                    )}
                  </div>
                )}
                {s.currentValue > 0 && invested > 0 && (
                  <div className="text-xs text-gray-500">
                    Current gain: <span className={gainPct >= 0 ? 'text-emerald-400' : 'text-red-400'}>{gainPct >= 0 ? '+' : ''}{gainPct}%</span>
                    <span className="ml-1">({fmt(Math.round(Number(s.currentValue) - invested))})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

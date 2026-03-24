'use client';
import { useState, useMemo } from 'react';
import { Save, ChevronDown, ChevronRight } from 'lucide-react';

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN')}`;
}

function calcEMI(principal, annualRate, tenureMonths) {
  const p = Number(principal) || 0;
  const n = Number(tenureMonths) || 0;
  const r = (Number(annualRate) || 0) / 1200; // monthly rate
  if (!p || !n) return 0;
  if (r === 0) return p / n;
  return Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function loanProgress(startDate, tenureMonths) {
  if (!startDate) return { paidMonths: 0, remainingMonths: Number(tenureMonths) || 0 };
  const start = new Date(startDate);
  const now   = new Date();
  const paid  = Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24 * 30.44)));
  const n     = Number(tenureMonths) || 0;
  return { paidMonths: Math.min(paid, n), remainingMonths: Math.max(0, n - paid) };
}

function AmortTable({ principal, annualRate, tenureMonths, emi }) {
  const r = (Number(annualRate) || 0) / 1200;
  const rows = [];
  let bal = Number(principal) || 0;
  const n = Math.min(Number(tenureMonths) || 0, 360);
  for (let i = 1; i <= n && bal > 0; i++) {
    const interest  = Math.round(bal * r);
    const prinPart  = Math.min(bal, emi - interest);
    bal = Math.max(0, bal - prinPart);
    rows.push({ month: i, emi, interest, principal: prinPart, balance: bal });
  }
  // Show only first 6 + last 3 rows
  const display = rows.length <= 12 ? rows : [
    ...rows.slice(0, 6),
    { month: '…', emi: '', interest: '', principal: '', balance: '' },
    ...rows.slice(-3),
  ];
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs text-gray-400">
        <thead>
          <tr className="border-b border-white/10 text-gray-500">
            <th className="text-left py-1.5 pr-3">Month</th>
            <th className="text-right pr-3">EMI</th>
            <th className="text-right pr-3">Interest</th>
            <th className="text-right pr-3">Principal</th>
            <th className="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {display.map((r, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="py-1.5 pr-3">{r.month}</td>
              <td className="text-right pr-3">{r.emi ? fmt(r.emi) : ''}</td>
              <td className="text-right pr-3 text-red-400">{r.interest !== '' ? fmt(r.interest) : ''}</td>
              <td className="text-right pr-3 text-emerald-400">{r.principal !== '' ? fmt(r.principal) : ''}</td>
              <td className="text-right">{r.balance !== '' ? fmt(r.balance) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LOAN_TYPES = ['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Gold Loan', 'Credit Card', 'Other'];
const INPUT = 'w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-amber-400/40 focus:outline-none';

export default function LoansSection({ loans, setLoans, onSave, saveState }) {
  const [expandedId, setExpandedId] = useState(null);
  const [showAmort, setShowAmort] = useState({});

  const addLoan = () => {
    setLoans((prev) => ({
      ...prev,
      items: [...(prev.items || []), {
        id: Date.now(), name: '', type: 'Home Loan', principal: 0,
        rate: 0, tenure: 0, startDate: '', notes: '',
      }],
    }));
  };

  const upd = (id, field, value) => {
    setLoans((prev) => ({
      ...prev,
      items: (prev.items || []).map((l) => l.id === id ? { ...l, [field]: value } : l),
    }));
  };

  const rem = (id) => setLoans((prev) => ({ ...prev, items: (prev.items || []).filter((l) => l.id !== id) }));

  const totals = useMemo(() => {
    return (loans.items || []).reduce((acc, l) => {
      const emi = calcEMI(l.principal, l.rate, l.tenure);
      const totalPayable = emi * (Number(l.tenure) || 0);
      const totalInterest = totalPayable - (Number(l.principal) || 0);
      const { remainingMonths } = loanProgress(l.startDate, l.tenure);
      acc.emi += emi;
      acc.outstanding += emi * remainingMonths;
      return acc;
    }, { emi: 0, outstanding: 0 });
  }, [loans]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🏦</span> Loan EMI Tracker
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Track all loans, compute EMIs and amortization schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={addLoan}
            className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
            + Add Loan
          </button>
          <button type="button" onClick={onSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/25 transition-colors text-sm">
            <Save size={14} /> Save
          </button>
          {saveState.status !== 'idle' && (
            <span className={saveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{saveState.message}</span>
          )}
        </div>
      </div>

      {/* Summary strip */}
      {(loans.items || []).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-red-500/8 border border-red-400/20">
            <div className="text-xs text-gray-500 mb-1">Total Monthly EMI</div>
            <div className="text-xl font-bold text-red-300">{fmt(totals.emi)}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10">
            <div className="text-xs text-gray-500 mb-1">Total Outstanding</div>
            <div className="text-xl font-bold text-amber-300">{fmt(Math.round(totals.outstanding))}</div>
          </div>
        </div>
      )}

      {/* Loan cards */}
      {(loans.items || []).length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm bg-slate-900/30 border border-white/5 rounded-2xl">
          No loans added. Click &quot;+ Add Loan&quot; to track a loan.
        </div>
      ) : (
        <div className="space-y-4">
          {(loans.items || []).map((loan) => {
            const emi       = calcEMI(loan.principal, loan.rate, loan.tenure);
            const total     = emi * (Number(loan.tenure) || 0);
            const interest  = Math.max(0, total - (Number(loan.principal) || 0));
            const { paidMonths, remainingMonths } = loanProgress(loan.startDate, loan.tenure);
            const progress = loan.tenure > 0 ? Math.round((paidMonths / Number(loan.tenure)) * 100) : 0;
            const outstanding = emi * remainingMonths;
            const open = expandedId === loan.id;

            return (
              <div key={loan.id} className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(open ? null : loan.id)}>
                  {open ? <ChevronDown size={16} className="text-gray-500 shrink-0" /> : <ChevronRight size={16} className="text-gray-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-200 truncate">{loan.name || 'Unnamed Loan'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 shrink-0">{loan.type}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {fmt(loan.principal)} · {loan.rate}% · {loan.tenure}m
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-amber-300">{fmt(emi)}/mo</div>
                    <div className="text-xs text-gray-500">{remainingMonths}m left</div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); rem(loan.id); }}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-2 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress bar */}
                {loan.startDate && loan.tenure > 0 && (
                  <div className="px-5 pb-3">
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{paidMonths}m paid ({progress}%)</span>
                      <span>Outstanding {fmt(Math.round(outstanding))}</span>
                    </div>
                  </div>
                )}

                {/* Expanded fields */}
                {open && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Loan Name</span>
                        <input value={loan.name} onChange={(e) => upd(loan.id, 'name', e.target.value)}
                          placeholder="e.g. HDFC Home Loan" className={INPUT} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Type</span>
                        <select value={loan.type} onChange={(e) => upd(loan.id, 'type', e.target.value)} className={INPUT + ' bg-slate-900'}>
                          {LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Principal (₹)</span>
                        <input type="number" min={0} value={loan.principal ?? 0}
                          onChange={(e) => upd(loan.id, 'principal', e.target.value)} className={INPUT} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Interest Rate (% p.a.)</span>
                        <input type="number" min={0} step={0.01} value={loan.rate ?? 0}
                          onChange={(e) => upd(loan.id, 'rate', e.target.value)} className={INPUT} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Tenure (months)</span>
                        <input type="number" min={0} value={loan.tenure ?? 0}
                          onChange={(e) => upd(loan.id, 'tenure', e.target.value)} className={INPUT} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Start Date</span>
                        <input type="date" value={loan.startDate || ''}
                          onChange={(e) => upd(loan.id, 'startDate', e.target.value)}
                          className={INPUT + ' text-gray-300'} />
                      </label>
                    </div>
                    <input value={loan.notes || ''} onChange={(e) => upd(loan.id, 'notes', e.target.value)}
                      placeholder="Notes" className={INPUT + ' text-gray-400'} />

                    {/* Computed summary */}
                    {emi > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {[
                          { l: 'Monthly EMI', v: fmt(emi) },
                          { l: 'Total Interest', v: fmt(Math.round(interest)) },
                          { l: 'Total Payable', v: fmt(Math.round(total)) },
                        ].map(({ l, v }) => (
                          <div key={l} className="p-2 rounded-lg bg-slate-800/50 border border-white/5">
                            <div className="text-gray-500">{l}</div>
                            <div className="font-semibold text-gray-200 mt-0.5">{v}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {emi > 0 && (
                      <button type="button"
                        onClick={() => setShowAmort((prev) => ({ ...prev, [loan.id]: !prev[loan.id] }))}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                        {showAmort[loan.id] ? '▲ Hide' : '▼ Show'} amortization schedule
                      </button>
                    )}
                    {showAmort[loan.id] && <AmortTable principal={loan.principal} annualRate={loan.rate} tenureMonths={loan.tenure} emi={emi} />}
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

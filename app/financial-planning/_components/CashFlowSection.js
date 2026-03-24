'use client';
import { useMemo } from 'react';
import { Save } from 'lucide-react';

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN')}`;
}

const INPUT = 'w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-cyan-400/40 focus:outline-none';

const EVENT_CATEGORIES = [
  'Salary', 'Rent', 'EMI', 'Utilities', 'SIP / Investment', 'Insurance Premium',
  'Subscription', 'School Fee', 'Credit Card', 'Other Income', 'Other Expense',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CashFlowSection({ cashflow, setCashflow, onSave, saveState }) {
  const addEvent = () => setCashflow((prev) => ({
    ...prev,
    events: [...(prev.events || []), {
      id: Date.now(), label: '', type: 'expense', amount: 0, day: 1,
      category: 'Other Expense', active: true, notes: '',
    }],
  }));

  const upd = (id, field, value) => setCashflow((prev) => ({
    ...prev,
    events: (prev.events || []).map((e) => e.id === id ? { ...e, [field]: value } : e),
  }));

  const rem = (id) => setCashflow((prev) => ({ ...prev, events: (prev.events || []).filter((e) => e.id !== id) }));

  const activeEvents = useMemo(() => (cashflow.events || []).filter((e) => e.active !== false), [cashflow]);

  const totals = useMemo(() => {
    return activeEvents.reduce((acc, e) => {
      const amt = Number(e.amount) || 0;
      if (e.type === 'income') acc.income += amt;
      else acc.expense += amt;
      return acc;
    }, { income: 0, expense: 0 });
  }, [activeEvents]);

  // Build 31-day calendar grid
  const calendarDays = useMemo(() => {
    const days = Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      events: activeEvents.filter((e) => Number(e.day) === i + 1),
    }));
    return days;
  }, [activeEvents]);

  const net = totals.income - totals.expense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📅</span> Cash Flow Calendar
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Map recurring income and expenses to calendar days.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={addEvent}
            className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
            + Add Event
          </button>
          <button type="button" onClick={onSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/25 transition-colors text-sm">
            <Save size={14} /> Save
          </button>
          {saveState.status !== 'idle' && (
            <span className={saveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{saveState.message}</span>
          )}
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-400/20">
          <div className="text-xs text-gray-500 mb-1">Monthly Income</div>
          <div className="text-xl font-bold text-emerald-300">{fmt(totals.income)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-red-500/8 border border-red-400/20">
          <div className="text-xs text-gray-500 mb-1">Monthly Outflow</div>
          <div className="text-xl font-bold text-red-300">{fmt(totals.expense)}</div>
        </div>
        <div className={`p-4 rounded-2xl border ${net >= 0 ? 'bg-blue-500/8 border-blue-400/20' : 'bg-red-500/8 border-red-400/20'}`}>
          <div className="text-xs text-gray-500 mb-1">Net Cash Flow</div>
          <div className={`text-xl font-bold ${net >= 0 ? 'text-blue-300' : 'text-red-300'}`}>{net < 0 ? '-' : ''}{fmt(Math.abs(net))}</div>
        </div>
      </div>

      {/* Calendar strip */}
      {activeEvents.length > 0 && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Monthly Calendar View</h3>
          <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-[repeat(31,minmax(0,1fr))] gap-1">
            {calendarDays.map(({ day, events: dayEvents }) => {
              const hasIncome  = dayEvents.some((e) => e.type === 'income');
              const hasExpense = dayEvents.some((e) => e.type === 'expense');
              const total = dayEvents.reduce((s, e) => {
                return s + (e.type === 'income' ? (Number(e.amount) || 0) : -(Number(e.amount) || 0));
              }, 0);
              return (
                <div key={day} title={dayEvents.map((e) => `${e.label} ${fmt(e.amount)}`).join('\n')}
                  className={`rounded-lg p-1 min-h-[48px] flex flex-col items-center justify-start border transition-colors cursor-default
                    ${dayEvents.length === 0 ? 'bg-slate-800/30 border-white/5' : hasIncome && hasExpense ? 'bg-purple-500/10 border-purple-400/20' : hasIncome ? 'bg-emerald-500/10 border-emerald-400/20' : 'bg-red-500/10 border-red-400/20'}`}>
                  <span className="text-[10px] text-gray-500 font-medium">{day}</span>
                  {dayEvents.length > 0 && (
                    <span className={`text-[9px] font-semibold mt-0.5 leading-none ${total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {total >= 0 ? '+' : ''}{total >= 1000 ? `${Math.round(total / 1000)}k` : Math.round(total)}
                    </span>
                  )}
                  {dayEvents.slice(0, 2).map((e) => (
                    <span key={e.id} className={`text-[8px] leading-tight mt-0.5 truncate max-w-full ${e.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {e.label}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Income</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Expense</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Both</span>
          </div>
        </div>
      )}

      {/* Events list */}
      {(cashflow.events || []).length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm bg-slate-900/30 border border-white/5 rounded-2xl">
          No events added. Click &quot;+ Add Event&quot; to map your recurring cash flows.
        </div>
      ) : (
        <div className="space-y-2">
          {(cashflow.events || []).map((ev) => (
            <div key={ev.id} className={`bg-slate-900/50 border rounded-xl p-4 transition-opacity ${ev.active === false ? 'opacity-40' : ''} ${ev.type === 'income' ? 'border-emerald-500/15' : 'border-red-500/15'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle active */}
                <button type="button" onClick={() => upd(ev.id, 'active', ev.active === false ? true : false)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${ev.active !== false ? 'bg-cyan-500/30 border-cyan-400/40' : 'border-white/20'}`}>
                  {ev.active !== false && <svg className="w-3 h-3 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
                {/* Day */}
                <label className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-gray-500">Day</span>
                  <input type="number" min={1} max={31} value={ev.day ?? 1}
                    onChange={(e) => upd(ev.id, 'day', e.target.value)}
                    className="w-14 px-2 py-1 bg-slate-900/60 border border-white/10 rounded-lg text-xs text-center" />
                </label>
                {/* Type */}
                <select value={ev.type} onChange={(e) => upd(ev.id, 'type', e.target.value)}
                  className={`text-xs px-2 py-1 rounded-lg border bg-slate-900 ${ev.type === 'income' ? 'border-emerald-400/30 text-emerald-300' : 'border-red-400/30 text-red-300'}`}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                {/* Label */}
                <input value={ev.label} onChange={(e) => upd(ev.id, 'label', e.target.value)}
                  placeholder="Label (e.g. Salary, Rent, SIP)"
                  className="flex-1 min-w-[140px] px-2 py-1 bg-transparent border-b border-white/10 hover:border-white/20 text-sm text-gray-200 focus:outline-none focus:border-cyan-400/40" />
                {/* Amount */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-gray-500">₹</span>
                  <input type="number" min={0} value={ev.amount ?? 0}
                    onChange={(e) => upd(ev.id, 'amount', e.target.value)}
                    className="w-28 px-2 py-1 bg-slate-900/60 border border-white/10 rounded-lg text-sm" />
                </div>
                {/* Category */}
                <select value={ev.category || 'Other'} onChange={(e) => upd(ev.id, 'category', e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-slate-900 text-gray-400 hidden md:block">
                  {EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => rem(ev.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

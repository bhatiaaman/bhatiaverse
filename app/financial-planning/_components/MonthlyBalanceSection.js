'use client';
import { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Save, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const uid = () => Math.random().toString(36).slice(2, 9);

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function prevMonth(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Default outgo labels — sourced from Monthly Running categories
const DEFAULT_OUTGO_LABELS = [
  'Home', 'Support', 'Personal', 'Kids', 'Equity Fund', 'Travel Fund',
  'CC Exp', 'Health Fund', 'Savings', 'Brokers', 'Loan Fund', 'Misc',
];

const DEFAULT_INGO_LABELS = [
  'Cash', 'Banks', 'Salary', 'Bonus', 'Reimbursement', 'Interest', 'Misc Src',
];

function defaultOutgo() {
  return DEFAULT_OUTGO_LABELS.map((label) => ({ id: uid(), label, amount: '' }));
}

function defaultIngo() {
  return DEFAULT_INGO_LABELS.map((label) => ({ id: uid(), label, amount: '' }));
}

function defaultMonthData() {
  return { outgo: defaultOutgo(), ingo: defaultIngo() };
}

// ── Row editor ─────────────────────────────────────────────────────────────
function Row({ item, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2 group">
      <input
        value={item.label}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        placeholder="Label"
        className="flex-1 min-w-0 bg-transparent border-b border-white/10 focus:border-blue-500 outline-none text-sm text-gray-200 py-1 placeholder-gray-600 transition-colors"
      />
      <input
        type="number"
        value={item.amount}
        onChange={(e) => onChange({ ...item, amount: e.target.value })}
        placeholder="0"
        className="w-28 text-right bg-transparent border-b border-white/10 focus:border-blue-500 outline-none text-sm text-gray-100 py-1 placeholder-gray-600 transition-colors"
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Panel (Outgo or Ingo) ───────────────────────────────────────────────────
function Panel({ title, icon: Icon, color, items, onChange, total }) {
  const addRow = () => onChange([...items, { id: uid(), label: '', amount: '' }]);

  const updateRow = (id, updated) =>
    onChange(items.map((r) => (r.id === id ? updated : r)));

  const removeRow = (id) =>
    onChange(items.filter((r) => r.id !== id));

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className={`flex items-center gap-2 pb-2 border-b ${color.border}`}>
        <Icon className={`w-4 h-4 ${color.icon}`} />
        <span className={`text-sm font-semibold uppercase tracking-wider ${color.text}`}>
          {title}
        </span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Row
            key={item.id}
            item={item}
            onChange={(updated) => updateRow(item.id, updated)}
            onRemove={() => removeRow(item.id)}
          />
        ))}
      </div>

      {/* Add row */}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1"
      >
        <Plus className="w-3.5 h-3.5" /> Add row
      </button>

      {/* Total */}
      <div className={`flex justify-between items-center pt-2 border-t ${color.border} mt-auto`}>
        <span className="text-xs text-gray-400 uppercase tracking-wider">Total</span>
        <span className={`text-base font-bold ${color.text}`}>₹{fmt(total)}</span>
      </div>
    </div>
  );
}

export default function MonthlyBalanceSection({ monthlyBalance, setMonthlyBalance, onSave, saveState }) {
  const [activeMonth, setActiveMonth] = useState(currentMonthKey());

  // Get or initialise month data
  const monthData = monthlyBalance?.months?.[activeMonth] ?? defaultMonthData();

  const updateMonthData = useCallback((patch) => {
    setMonthlyBalance((prev) => ({
      ...prev,
      months: {
        ...(prev.months || {}),
        [activeMonth]: {
          ...(prev.months?.[activeMonth] ?? defaultMonthData()),
          ...patch,
        },
      },
    }));
  }, [activeMonth, setMonthlyBalance]);

  // Copy previous month's labels (amounts reset to 0)
  const copyFromPrev = () => {
    const prev = prevMonth(activeMonth);
    const prevData = monthlyBalance?.months?.[prev];
    if (!prevData) return;
    updateMonthData({
      outgo: prevData.outgo.map((r) => ({ ...r, id: uid(), amount: '' })),
      ingo:  prevData.ingo.map((r)  => ({ ...r, id: uid(), amount: '' })),
    });
  };

  const hasPrevData = !!monthlyBalance?.months?.[prevMonth(activeMonth)];
  const isCurrentOrFuture = activeMonth >= currentMonthKey();

  const outgoTotal = (monthData.outgo || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const ingoTotal  = (monthData.ingo  || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const balance    = ingoTotal - outgoTotal;
  const balanced   = Math.abs(balance) < 1;

  return (
    <div className="space-y-5">
      {/* ── Title bar ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🏦 Monthly Balance
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Record actual inflows and outflows for the month.
          </p>
        </div>

        {/* Balance pill */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          balanced
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            : balance > 0
              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
              : 'bg-red-500/10 text-red-300 border border-red-500/30'
        }`}>
          {balanced ? '✓ Balanced' : balance > 0 ? `+₹${fmt(balance)} surplus` : `-₹${fmt(Math.abs(balance))} gap`}
        </div>
      </div>

      {/* ── Month nav ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
        <button
          onClick={() => setActiveMonth(prevMonth(activeMonth))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-white">{monthLabel(activeMonth)}</span>
          {!isCurrentOrFuture && (
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">past</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasPrevData && !(monthlyBalance?.months?.[activeMonth]) && (
            <button
              onClick={copyFromPrev}
              className="text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Copy labels from {monthLabel(prevMonth(activeMonth))}
            </button>
          )}
          <button
            onClick={() => setActiveMonth(nextMonth(activeMonth))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OUTGO */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/8">
          <Panel
            title="Outgo"
            icon={ArrowUpCircle}
            color={{ border: 'border-red-500/20', icon: 'text-red-400', text: 'text-red-300' }}
            items={monthData.outgo || []}
            total={outgoTotal}
            onChange={(outgo) => updateMonthData({ outgo })}
          />
        </div>

        {/* INGO */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/8">
          <Panel
            title="Ingo"
            icon={ArrowDownCircle}
            color={{ border: 'border-emerald-500/20', icon: 'text-emerald-400', text: 'text-emerald-300' }}
            items={monthData.ingo || []}
            total={ingoTotal}
            onChange={(ingo) => updateMonthData({ ingo })}
          />
        </div>
      </div>

      {/* ── Summary strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Outgo', value: outgoTotal, color: 'text-red-300' },
          { label: 'Total Ingo',  value: ingoTotal,  color: 'text-emerald-300' },
          { label: 'Net',         value: balance,    color: balanced ? 'text-emerald-300' : balance > 0 ? 'text-blue-300' : 'text-red-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 rounded-xl px-4 py-3 text-center border border-white/8">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>
              {value < 0 ? '-' : ''}₹{fmt(Math.abs(value))}
            </p>
          </div>
        ))}
      </div>

      {/* ── Save ────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saveState?.status === 'saving'}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Save className="w-4 h-4" />
          {saveState?.status === 'saving' ? 'Saving…' : saveState?.status === 'saved' ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </div>
  );
}

'use client';
import { useState, useCallback } from 'react';

// Main categories to sync with Running Budget
const SYNC_CATEGORIES = ['Home', 'Support', 'Personal', 'Kids', 'Loan'];
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

// Default ingo labels — can be customized as needed
const DEFAULT_INGO_LABELS = [
  'Bank', 'Salary', 'Other',
];

function defaultOutgo() {
  return DEFAULT_OUTGO_LABELS.map((label) => ({ id: uid(), label, subs: [] }));
}

function defaultIngo() {
  // Each ingo category starts with one empty subcategory for convenience
  return DEFAULT_INGO_LABELS.map((label) => ({ id: uid(), label, subs: [{ id: uid(), label: '', amount: '' }] }));
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


// Helper to get subcategories from Running Budget (Monthly View)
function getRunningBudgetCategories(monthly, monthKey) {
  // Defensive: monthly.months[monthKey]?.categories
  return (
    monthly?.months?.[monthKey]?.categories || []
  );
}

export default function MonthlyBalanceSection({ monthlyBalance, setMonthlyBalance, onSave, saveState, monthly }) {
  const [activeMonth, setActiveMonth] = useState(currentMonthKey());
  const [showOutgoWarning, setShowOutgoWarning] = useState(false);
  const [outgoEditOrigin, setOutgoEditOrigin] = useState({});

  // Get or initialise month data
  const monthData = monthlyBalance?.months?.[activeMonth] ?? defaultMonthData();

  // Get Running Budget categories for this month
  const runningBudgetCats = getRunningBudgetCategories(monthly, activeMonth);

  // Build a mapping: { Home: [sub1, sub2, ...], ... }
  const syncCatMap = {};
  for (const cat of runningBudgetCats) {
    if (SYNC_CATEGORIES.includes(cat.label)) {
      syncCatMap[cat.label] = cat.subs ? cat.subs.map(sub => ({ ...sub })) : [];
    }
  }


  // For each category, get subcategories (sync with Running Budget for SYNC_CATEGORIES, else use as is)
  const getOrInitSubcatValues = (catLabel) => {
    const runningSubs = syncCatMap[catLabel] || [];
    let outgoCat = (monthData.outgo || []).find(c => c.label === catLabel);
    if (!outgoCat) {
      // Initialize
      if (SYNC_CATEGORIES.includes(catLabel) && runningSubs.length > 0) {
        outgoCat = { label: catLabel, subs: runningSubs.map(sub => ({ id: sub.id, label: sub.label, amount: '' })) };
      } else {
        outgoCat = { label: catLabel, subs: [] };
      }
    } else if (SYNC_CATEGORIES.includes(catLabel)) {
      // For synced categories, merge runningSubs and custom
      const existing = {};
      for (const s of outgoCat.subs || []) existing[s.id] = s;
      const customRows = (outgoCat.subs || []).filter(s => !runningSubs.find(r => r.id === s.id));
      outgoCat = {
        ...outgoCat,
        subs: [
          ...runningSubs.map(sub => existing[sub.id] ? { ...existing[sub.id], label: sub.label } : { id: sub.id, label: sub.label, amount: '' }),
          ...customRows
        ]
      };
    }
    // For custom categories, just return as is
    return Array.isArray(outgoCat.subs) ? outgoCat.subs : [];
  };

  // Add custom subcategory row to a main category
  const addCustomSubcat = (catLabel) => {
    setMonthlyBalance((prev) => {
      const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
      let outgo = prevMonth.outgo ? [...prevMonth.outgo] : [];
      let catIdx = outgo.findIndex(c => c.label === catLabel);
      let cat = catIdx >= 0 ? { ...outgo[catIdx] } : { label: catLabel, subs: [] };
      cat.subs = [...(cat.subs || []), { id: uid(), label: '', amount: '' }];
      if (catIdx >= 0) outgo[catIdx] = cat;
      else outgo.push(cat);
      return {
        ...prev,
        months: {
          ...(prev.months || {}),
          [activeMonth]: {
            ...prevMonth,
            outgo,
          },
        },
      };
    });
  };

  const confirmLinkedOutgoEdit = (catLabel, subLabel) => {
    const message = `Outgo subcategory '${catLabel} / ${subLabel}' is linked to Monthly View running expense.\n\n` +
      `Confirm manual update? This may break tracking between sections.`;
    return window.confirm(message);
  };

  const applyOutgoAmountChange = (catLabel, subId, newValue) => {
    setShowOutgoWarning(true);
    setOutgoAmount(catLabel, subId, newValue);
  };

  const setOutgoAmount = (catLabel, subId, newValue) => {
    setMonthlyBalance((prev) => {
      const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
      let outgo = prevMonth.outgo ? [...prevMonth.outgo] : [];
      let catIdx = outgo.findIndex(c => c.label === catLabel);
      let catObj = catIdx >= 0 ? { ...outgo[catIdx] } : { label: catLabel, subs: [] };
      catObj.subs = catObj.subs.map(s => s.id === subId ? { ...s, amount: newValue } : s);
      if (catIdx >= 0) outgo[catIdx] = catObj;
      else outgo.push(catObj);
      return {
        ...prev,
        months: {
          ...(prev.months || {}),
          [activeMonth]: {
            ...prevMonth,
            outgo,
          },
        },
      };
    });
  };

  // Add a new main category (with empty sub list)
  const addMainCategory = () => {
    setMonthlyBalance((prev) => {
      const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
      let outgo = prevMonth.outgo ? [...prevMonth.outgo] : [];
      // Add a new main category with a default subcategory
      outgo.push({ label: '', subs: [{ id: uid(), label: '', amount: '' }] });
      return {
        ...prev,
        months: {
          ...(prev.months || {}),
          [activeMonth]: {
            ...prevMonth,
            outgo,
          },
        },
      };
    });
  };

  // Update handler for subcategory value
  const updateSubcatAmount = (catLabel, subId, value) => {
    setMonthlyBalance((prev) => {
      const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
      let outgo = prevMonth.outgo ? [...prevMonth.outgo] : [];
      let catIdx = outgo.findIndex(c => c.label === catLabel);
      let cat = catIdx >= 0 ? { ...outgo[catIdx] } : { label: catLabel, subs: [] };
      // Sync sub list
      const runningSubs = syncCatMap[catLabel] || [];
      const existing = {};
      for (const s of cat.subs || []) existing[s.id] = s;
      cat.subs = runningSubs.map(sub => {
        if (sub.id === subId) {
          return { id: sub.id, label: sub.label, amount: value };
        }
        return existing[sub.id] ? { ...existing[sub.id], label: sub.label } : { id: sub.id, label: sub.label, amount: '' };
      });
      if (catIdx >= 0) outgo[catIdx] = cat;
      else outgo.push(cat);
      return {
        ...prev,
        months: {
          ...(prev.months || {}),
          [activeMonth]: {
            ...prevMonth,
            outgo,
          },
        },
      };
    });
  };

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


  // Calculate totals for synced categories
  const outgoTotals = {};
  let outgoTotal = 0;
  // Calculate totals for all categories (synced and custom)
  (monthData.outgo || []).forEach(cat => {
    const subs = getOrInitSubcatValues(cat.label);
    const sum = subs.reduce((s, sub) => s + (Number(sub.amount) || 0), 0);
    outgoTotals[cat.label] = sum;
    outgoTotal += sum;
  });

  // Calculate total Ingo by summing all subcategory amounts for each Ingo category
  const ingoTotal = (monthData.ingo || []).reduce((total, cat) => {
    const sum = (cat.subs || []).reduce((s, sub) => s + (Number(sub.amount) || 0), 0);
    return total + sum;
  }, 0);
  const balance    = ingoTotal - outgoTotal;
  const balanced   = Math.abs(balance) < 1;

  return (
    <div className="space-y-5">

      {/* ── Title bar with Save button ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🏦 Monthly Balance
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Record actual inflows and outflows for the month.
          </p>
          {showOutgoWarning && (
            <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-amber-100 text-xs">
              <strong>Warning:</strong> This outgo subcategory is linked to Monthly View running spend.
              Manually changing these values may make the linked balance unpredictable.
              <button
                onClick={() => setShowOutgoWarning(false)}
                className="ml-2 text-amber-200 underline"
              >Dismiss</button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Save button at top */}
          <button
            onClick={onSave}
            disabled={saveState?.status === 'saving'}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {saveState?.status === 'saving' ? 'Saving…' : saveState?.status === 'saved' ? 'Saved ✓' : 'Save'}
          </button>
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


      {/* ── Outgo and Ingo side by side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OUTGO: All categories (synced + custom) */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/8">
          <h3 className="text-lg font-semibold text-red-300 mb-4">Outgo (by Subcategory)</h3>
          {(monthData.outgo || []).map((cat, idx) => {
            const isSynced = SYNC_CATEGORIES.includes(cat.label);
            const subs = getOrInitSubcatValues(cat.label);
            return (
              <div key={cat.id || (cat.label + idx)} className="mb-6 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    className="font-semibold text-sm text-gray-200 mb-2 bg-transparent border-b border-white/10 focus:border-blue-500 outline-none px-1 flex-1"
                    value={cat.label}
                    onChange={e => {
                      setMonthlyBalance((prev) => {
                        const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                        let outgo = prevMonth.outgo ? [...prevMonth.outgo] : [];
                        outgo = outgo.map(c => c.id === cat.id ? { ...c, label: e.target.value } : c);
                        return {
                          ...prev,
                          months: {
                            ...(prev.months || {}),
                            [activeMonth]: {
                              ...prevMonth,
                              outgo,
                            },
                          },
                        };
                      });
                    }}
                    placeholder="Category name"
                  />
                  <button
                    onClick={() => {
                      setMonthlyBalance((prev) => {
                        const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                        let outgo = prevMonth.outgo ? [...prevMonth.outgo] : [];
                        outgo = outgo.filter(c => c.id !== cat.id);
                        return {
                          ...prev,
                          months: {
                            ...(prev.months || {}),
                            [activeMonth]: {
                              ...prevMonth,
                              outgo,
                            },
                          },
                        };
                      });
                    }}
                    className="opacity-60 hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {subs.map((sub, subIdx) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <input
                        className="flex-1 text-gray-300 text-sm bg-transparent border-b border-white/10 focus:border-blue-500 outline-none px-1"
                        value={sub.label}
                        onChange={e => {
                          setMonthlyBalance((prev) => {
                            const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                            let outgo = prevMonth.outgo ? [...prevMonth.outgo] : [];
                            let catIdx = outgo.findIndex(c => c.label === cat.label);
                            let catObj = catIdx >= 0 ? { ...outgo[catIdx] } : { label: cat.label, subs: [] };
                            catObj.subs = catObj.subs.map(s => s.id === sub.id ? { ...s, label: e.target.value } : s);
                            if (catIdx >= 0) outgo[catIdx] = catObj;
                            else outgo.push(catObj);
                            return {
                              ...prev,
                              months: {
                                ...(prev.months || {}),
                                [activeMonth]: {
                                  ...prevMonth,
                                  outgo,
                                },
                              },
                            };
                          });
                        }}
                        placeholder="Subcategory name"
                      />
                      <input
                        type="number"
                        value={sub.amount ?? ''}
                        onFocus={() => {
                          const key = `${cat.label}::${sub.id}`;
                          setOutgoEditOrigin((prev) => ({ ...prev, [key]: sub.amount ?? '' }));
                        }}
                        onChange={e => {
                          setOutgoAmount(cat.label, sub.id, e.target.value);
                        }}
                        onBlur={() => {
                          const key = `${cat.label}::${sub.id}`;
                          const oldValue = outgoEditOrigin[key];
                          const currentValue = sub.amount ?? '';
                          if (oldValue !== undefined && oldValue !== currentValue) {
                            if (confirmLinkedOutgoEdit(cat.label, sub.label)) {
                              setShowOutgoWarning(true);
                            } else {
                              setOutgoAmount(cat.label, sub.id, oldValue);
                            }
                          }
                          setOutgoEditOrigin((prev) => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                          });
                        }}
                        className="w-28 text-right bg-transparent border-b border-white/10 focus:border-blue-500 outline-none text-sm text-gray-100 py-1 placeholder-gray-600 transition-colors"
                        placeholder="0"
                      />
                      <button
                        onClick={() => {
                          setMonthlyBalance((prev) => {
                            const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                            let outgo = prevMonth.outgo ? [...prevMonth.outgo] : [];
                            let catIdx = outgo.findIndex(c => c.label === cat.label);
                            let catObj = catIdx >= 0 ? { ...outgo[catIdx] } : { label: cat.label, subs: [] };
                            catObj.subs = catObj.subs.filter(s => s.id !== sub.id);
                            if (catIdx >= 0) outgo[catIdx] = catObj;
                            else outgo.push(catObj);
                            return {
                              ...prev,
                              months: {
                                ...(prev.months || {}),
                                [activeMonth]: {
                                  ...prevMonth,
                                  outgo,
                                },
                              },
                            };
                          });
                        }}
                        className="opacity-60 hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addCustomSubcat(cat.label)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add row
                </button>
                <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Total</span>
                  <span className="text-base font-bold text-red-300">₹{fmt(outgoTotals[cat.label] || 0)}</span>
                </div>
              </div>
            );
          })}
          <button
            onClick={addMainCategory}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>

        {/* INGO: All categories (customizable) */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/8">
          <h3 className="text-lg font-semibold text-emerald-300 mb-4">Ingo (by Subcategory)</h3>
          {(monthData.ingo || []).map((cat, idx) => (
            <div key={cat.id || (cat.label + idx)} className="mb-6 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  className="font-semibold text-sm text-gray-200 mb-2 bg-transparent border-b border-white/10 focus:border-emerald-500 outline-none px-1 flex-1"
                  value={cat.label}
                  onChange={e => {
                    setMonthlyBalance((prev) => {
                      const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                      let ingo = prevMonth.ingo ? [...prevMonth.ingo] : [];
                      ingo = ingo.map(c => c.id === cat.id ? { ...c, label: e.target.value } : c);
                      return {
                        ...prev,
                        months: {
                          ...(prev.months || {}),
                          [activeMonth]: {
                            ...prevMonth,
                            ingo,
                          },
                        },
                      };
                    });
                  }}
                  placeholder="Category name"
                />
                <button
                  onClick={() => {
                    setMonthlyBalance((prev) => {
                      const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                      let ingo = prevMonth.ingo ? [...prevMonth.ingo] : [];
                      ingo = ingo.filter(c => c.id !== cat.id);
                      return {
                        ...prev,
                        months: {
                          ...(prev.months || {}),
                          [activeMonth]: {
                            ...prevMonth,
                            ingo,
                          },
                        },
                      };
                    });
                  }}
                  className="opacity-60 hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {(cat.subs || []).map((sub, subIdx) => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <input
                      className="flex-1 text-gray-300 text-sm bg-transparent border-b border-white/10 focus:border-emerald-500 outline-none px-1"
                      value={sub.label}
                      onChange={e => {
                        setMonthlyBalance((prev) => {
                          const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                          let ingo = prevMonth.ingo ? [...prevMonth.ingo] : [];
                          let catIdx = ingo.findIndex(c => c.label === cat.label);
                          let catObj = catIdx >= 0 ? { ...ingo[catIdx] } : { label: cat.label, subs: [] };
                          catObj.subs = catObj.subs.map(s => s.id === sub.id ? { ...s, label: e.target.value } : s);
                          if (catIdx >= 0) ingo[catIdx] = catObj;
                          else ingo.push(catObj);
                          return {
                            ...prev,
                            months: {
                              ...(prev.months || {}),
                              [activeMonth]: {
                                ...prevMonth,
                                ingo,
                              },
                            },
                          };
                        });
                      }}
                      placeholder="Subcategory name"
                    />
                    <input
                      type="number"
                      value={sub.amount ?? ''}
                      onChange={e => {
                        setMonthlyBalance((prev) => {
                          const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                          let ingo = prevMonth.ingo ? [...prevMonth.ingo] : [];
                          let catIdx = ingo.findIndex(c => c.label === cat.label);
                          let catObj = catIdx >= 0 ? { ...ingo[catIdx] } : { label: cat.label, subs: [] };
                          catObj.subs = catObj.subs.map(s => s.id === sub.id ? { ...s, amount: e.target.value } : s);
                          if (catIdx >= 0) ingo[catIdx] = catObj;
                          else ingo.push(catObj);
                          return {
                            ...prev,
                            months: {
                              ...(prev.months || {}),
                              [activeMonth]: {
                                ...prevMonth,
                                ingo,
                              },
                            },
                          };
                        });
                      }}
                      className="w-28 text-right bg-transparent border-b border-white/10 focus:border-emerald-500 outline-none text-sm text-gray-100 py-1 placeholder-gray-600 transition-colors"
                      placeholder="0"
                    />
                    <button
                      onClick={() => {
                        setMonthlyBalance((prev) => {
                          const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                          let ingo = prevMonth.ingo ? [...prevMonth.ingo] : [];
                          let catIdx = ingo.findIndex(c => c.label === cat.label);
                          let catObj = catIdx >= 0 ? { ...ingo[catIdx] } : { label: cat.label, subs: [] };
                          catObj.subs = catObj.subs.filter(s => s.id !== sub.id);
                          if (catIdx >= 0) ingo[catIdx] = catObj;
                          else ingo.push(catObj);
                          return {
                            ...prev,
                            months: {
                              ...(prev.months || {}),
                              [activeMonth]: {
                                ...prevMonth,
                                ingo,
                              },
                            },
                          };
                        });
                      }}
                      className="opacity-60 hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setMonthlyBalance((prev) => {
                    const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                    let ingo = prevMonth.ingo ? [...prevMonth.ingo] : [];
                    let catIdx = ingo.findIndex(c => c.label === cat.label);
                    let catObj = catIdx >= 0 ? { ...ingo[catIdx] } : { label: cat.label, subs: [] };
                    catObj.subs = [...(catObj.subs || []), { id: uid(), label: '', amount: '' }];
                    if (catIdx >= 0) ingo[catIdx] = catObj;
                    else ingo.push(catObj);
                    return {
                      ...prev,
                      months: {
                        ...(prev.months || {}),
                        [activeMonth]: {
                          ...prevMonth,
                          ingo,
                        },
                      },
                    };
                  });
                }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add row
              </button>
              <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Total</span>
                <span className="text-base font-bold text-emerald-300">₹{fmt((cat.subs || []).reduce((s, sub) => s + (Number(sub.amount) || 0), 0))}</span>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setMonthlyBalance((prev) => {
                const prevMonth = prev.months?.[activeMonth] ?? defaultMonthData();
                let ingo = prevMonth.ingo ? [...prevMonth.ingo] : [];
                ingo.push({ id: uid(), label: '', subs: [{ id: uid(), label: '', amount: '' }] });
                return {
                  ...prev,
                  months: {
                    ...(prev.months || {}),
                    [activeMonth]: {
                      ...prevMonth,
                      ingo,
                    },
                  },
                };
              });
            }}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
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


      {/* Save button moved to top, removed from bottom */}
    </div>
  );
}

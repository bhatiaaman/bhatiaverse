'use client';
import { useState, useRef, useMemo } from 'react';
import { Save } from 'lucide-react';

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN')}`;
}

const CATEGORIES = [
  'Salary', 'Transfer', 'Investment', 'Food & Dining', 'Groceries', 'Utilities',
  'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Loan EMI',
  'Insurance', 'Rent', 'Subscriptions', 'Other Income', 'Other Expense',
];

const INPUT = 'w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-green-400/40 focus:outline-none';

// Naive CSV parser (handles quoted fields)
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const parse = (line) => {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  };
  const headers = parse(lines[0]);
  const rows = lines.slice(1).map(parse).filter((r) => r.some((c) => c));
  return { headers, rows };
}

function detectType(value) {
  const v = String(value).toLowerCase().replace(/[,₹\s]/g, '');
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return n;
}

export default function DataImportSection({ transactions, setTransactions, onSave, saveState }) {
  const fileRef  = useRef(null);
  const [importStep, setImportStep] = useState('idle'); // idle | mapping | preview
  const [csvData, setCsvData] = useState(null); // { headers, rows }
  const [mapping, setMapping] = useState({ date: '', description: '', credit: '', debit: '', amount: '' });
  const [preview, setPreview] = useState([]);
  const [filter, setFilter] = useState({ type: 'all', search: '', month: '' });
  const [showImport, setShowImport] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setCsvData(parsed);
      // Auto-detect common column names
      const h = parsed.headers.map((h) => h.toLowerCase());
      const find = (...terms) => {
        const idx = h.findIndex((hdr) => terms.some((t) => hdr.includes(t)));
        return idx >= 0 ? parsed.headers[idx] : '';
      };
      setMapping({
        date: find('date', 'txn date', 'transaction date'),
        description: find('description', 'narration', 'particulars', 'remarks', 'detail'),
        credit: find('credit', 'cr', 'deposit'),
        debit: find('debit', 'dr', 'withdrawal'),
        amount: find('amount', 'amt'),
      });
      setImportStep('mapping');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const buildPreview = () => {
    if (!csvData) return;
    const rows = csvData.rows.slice(0, 200).map((row, i) => {
      const idx = (col) => csvData.headers.indexOf(col);
      const get = (col) => (idx(col) >= 0 ? row[idx(col)] : '');

      const dateRaw = get(mapping.date);
      const desc    = get(mapping.description);
      let amount    = 0;
      let type      = 'expense';

      if (mapping.credit && mapping.debit) {
        const cr = detectType(get(mapping.credit));
        const dr = detectType(get(mapping.debit));
        if (cr && cr > 0) { amount = cr; type = 'income'; }
        else if (dr && dr > 0) { amount = dr; type = 'expense'; }
      } else if (mapping.amount) {
        const v = detectType(get(mapping.amount));
        if (v) { amount = Math.abs(v); type = v > 0 ? 'income' : 'expense'; }
      }

      return {
        id: Date.now() + i,
        date: dateRaw,
        description: desc,
        amount,
        type,
        category: type === 'income' ? 'Other Income' : 'Other Expense',
        account: '',
        notes: '',
        imported: true,
      };
    }).filter((r) => r.amount > 0);
    setPreview(rows);
    setImportStep('preview');
  };

  const confirmImport = () => {
    setTransactions((prev) => ({
      ...prev,
      items: [...(prev.items || []), ...preview],
    }));
    setImportStep('idle');
    setCsvData(null);
    setPreview([]);
    setShowImport(false);
  };

  const addManual = () => {
    setTransactions((prev) => ({
      ...prev,
      items: [...(prev.items || []), {
        id: Date.now(), date: new Date().toISOString().slice(0, 10),
        description: '', amount: 0, type: 'expense', category: 'Other Expense',
        account: '', notes: '', imported: false,
      }],
    }));
  };

  const updTx = (id, field, value) => setTransactions((prev) => ({
    ...prev,
    items: (prev.items || []).map((t) => t.id === id ? { ...t, [field]: value } : t),
  }));
  const remTx = (id) => setTransactions((prev) => ({ ...prev, items: (prev.items || []).filter((t) => t.id !== id) }));

  // Filter + compute
  const filtered = useMemo(() => {
    return (transactions.items || []).filter((t) => {
      if (filter.type !== 'all' && t.type !== filter.type) return false;
      if (filter.search && !t.description?.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.month && !t.date?.startsWith(filter.month)) return false;
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, filter]);

  const summary = useMemo(() => {
    return filtered.reduce((acc, t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') acc.income += amt;
      else acc.expense += amt;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filtered]);

  // Category totals
  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const cat = t.category || 'Uncategorized';
      if (!map[cat]) map[cat] = { income: 0, expense: 0 };
      map[cat][t.type] = (map[cat][t.type] || 0) + (Number(t.amount) || 0);
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, net: v.income - v.expense }))
      .sort((a, b) => Math.abs(b.expense) - Math.abs(a.expense))
      .slice(0, 10);
  }, [filtered]);

  const availableMonths = useMemo(() => {
    const set = new Set((transactions.items || []).map((t) => (t.date || '').slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📥</span> Transactions
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Import bank statements or log transactions manually.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setShowImport(!showImport)}
            className="px-3 py-1.5 rounded-lg text-xs border border-green-400/30 bg-green-500/10 hover:bg-green-500/15 text-green-300 transition-colors">
            ↑ Import CSV
          </button>
          <button type="button" onClick={addManual}
            className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
            + Add Manual
          </button>
          <button type="button" onClick={onSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/40 text-green-200 hover:bg-green-500/25 transition-colors text-sm">
            <Save size={14} /> Save
          </button>
          {saveState.status !== 'idle' && (
            <span className={saveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{saveState.message}</span>
          )}
        </div>
      </div>

      {/* CSV Import panel */}
      {showImport && importStep === 'idle' && (
        <div className="bg-slate-900/50 border border-green-400/20 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-green-300">Import CSV Bank Statement</h3>
          <p className="text-xs text-gray-400">Export your bank statement as CSV and upload it. Supports most Indian bank formats.</p>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-xl border border-green-400/30 bg-green-500/10 text-green-300 text-sm hover:bg-green-500/15 transition-colors">
            Choose CSV File
          </button>
        </div>
      )}

      {/* Column mapping */}
      {showImport && importStep === 'mapping' && csvData && (
        <div className="bg-slate-900/50 border border-green-400/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-green-300">Map CSV Columns</h3>
          <p className="text-xs text-gray-400">{csvData.rows.length} rows detected. Map columns to fields:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Date Column', key: 'date' },
              { label: 'Description Column', key: 'description' },
              { label: 'Credit Column (income)', key: 'credit' },
              { label: 'Debit Column (expense)', key: 'debit' },
              { label: 'Amount Column (single)', key: 'amount' },
            ].map(({ label, key }) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">{label}</span>
                <select value={mapping[key]} onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                  className={INPUT + ' bg-slate-900'}>
                  <option value="">— Skip —</option>
                  {csvData.headers.map((h) => <option key={h}>{h}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            Preview (first row): {csvData.headers.map((h, i) => `${h}: ${csvData.rows[0]?.[i] ?? ''}`).join(' | ')}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={buildPreview}
              className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/40 text-green-200 text-sm hover:bg-green-500/25 transition-colors">
              Preview Import →
            </button>
            <button type="button" onClick={() => { setImportStep('idle'); setCsvData(null); }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {showImport && importStep === 'preview' && (
        <div className="bg-slate-900/50 border border-green-400/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-green-300">{preview.length} transactions ready to import</h3>
            <div className="flex gap-3">
              <button type="button" onClick={confirmImport}
                className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/40 text-green-200 text-sm hover:bg-green-500/25 transition-colors">
                ✓ Import All
              </button>
              <button type="button" onClick={() => setImportStep('mapping')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 transition-colors">
                ← Back
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {preview.slice(0, 50).map((r, i) => (
              <div key={i} className={`flex items-center gap-3 text-xs py-1.5 border-b border-white/5 ${r.type === 'income' ? 'text-emerald-300' : 'text-gray-300'}`}>
                <span className="text-gray-600 w-20 shrink-0">{r.date}</span>
                <span className="flex-1 truncate text-gray-400">{r.description}</span>
                <span className={`font-semibold shrink-0 ${r.type === 'income' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                </span>
              </div>
            ))}
            {preview.length > 50 && <div className="text-xs text-gray-500 text-center py-2">…and {preview.length - 50} more</div>}
          </div>
        </div>
      )}

      {/* Filters + summary */}
      {(transactions.items || []).length > 0 && (
        <>
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
            <input value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search transactions…" className="px-3 py-1.5 bg-slate-900/60 border border-white/10 rounded-lg text-sm flex-1 min-w-[160px] focus:outline-none focus:border-green-400/40" />
            <select value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
              className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-sm text-gray-400">
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={filter.month} onChange={(e) => setFilter((f) => ({ ...f, month: e.target.value }))}
              className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-sm text-gray-400">
              <option value="">All Months</option>
              {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="text-xs text-gray-500">{filtered.length} txn · In {fmt(Math.round(summary.income))} · Out {fmt(Math.round(summary.expense))}</span>
          </div>

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Top Categories</h3>
              <div className="space-y-2">
                {byCategory.map(({ name, income: inc, expense: exp }) => {
                  const total = inc + exp;
                  const maxVal = byCategory[0].income + byCategory[0].expense;
                  return (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="w-32 text-gray-400 truncate">{name}</span>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-violet-500 transition-all" style={{ width: `${(total / maxVal) * 100}%` }} />
                      </div>
                      {inc > 0 && <span className="text-emerald-400 shrink-0">+{fmt(Math.round(inc))}</span>}
                      {exp > 0 && <span className="text-red-400 shrink-0">-{fmt(Math.round(exp))}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction rows */}
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/40 border border-white/5 hover:bg-white/[0.02] group text-sm">
                <input type="date" value={t.date || ''}
                  onChange={(e) => updTx(t.id, 'date', e.target.value)}
                  className="text-xs text-gray-500 bg-transparent border-none focus:outline-none w-24 shrink-0" />
                <input value={t.description || ''}
                  onChange={(e) => updTx(t.id, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 bg-transparent text-gray-300 border-none focus:outline-none text-xs min-w-0" />
                <select value={t.category || 'Other'} onChange={(e) => updTx(t.id, 'category', e.target.value)}
                  className="hidden md:block text-xs bg-slate-800 border border-white/10 rounded px-2 py-0.5 text-gray-500 shrink-0">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={t.type} onChange={(e) => updTx(t.id, 'type', e.target.value)}
                  className={`text-xs px-2 py-0.5 rounded border bg-slate-900 shrink-0 ${t.type === 'income' ? 'border-emerald-400/30 text-emerald-300' : 'border-red-400/30 text-red-300'}`}>
                  <option value="income">+</option>
                  <option value="expense">-</option>
                </select>
                <input type="number" min={0} value={t.amount ?? 0}
                  onChange={(e) => updTx(t.id, 'amount', e.target.value)}
                  className={`w-24 text-right text-xs px-2 py-1 bg-slate-900/60 border border-white/10 rounded-lg ${t.type === 'income' ? 'text-emerald-300' : 'text-red-300'}`} />
                <button type="button" onClick={() => remTx(t.id)}
                  className="p-1 rounded text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">No transactions match your filter.</div>
            )}
          </div>
        </>
      )}

      {(transactions.items || []).length === 0 && !showImport && (
        <div className="text-center py-16 text-gray-500 text-sm bg-slate-900/30 border border-white/5 rounded-2xl space-y-3">
          <div>No transactions yet.</div>
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={() => setShowImport(true)}
              className="px-4 py-2 rounded-xl border border-green-400/30 text-green-300 text-xs hover:bg-green-500/10 transition-colors">
              Import CSV Statement
            </button>
            <button type="button" onClick={addManual}
              className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-xs hover:bg-white/5 transition-colors">
              Add Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

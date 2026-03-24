'use client';
import { useState, useMemo } from 'react';
import { Save, Info } from 'lucide-react';

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN')}`;
}

// FY 2025-26 slabs
function computeOldRegimeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.30;
  if (taxableIncome > 500000)  tax += (Math.min(taxableIncome, 1000000) - 500000) * 0.20;
  if (taxableIncome > 250000)  tax += (Math.min(taxableIncome, 500000) - 250000) * 0.05;
  // 87A rebate: if income ≤ 5L, full tax rebate (max ₹12,500)
  if (taxableIncome <= 500000) tax = Math.max(0, tax - 12500);
  return Math.round(tax * 1.04); // +4% cess
}

function computeNewRegimeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.30;
  if (taxableIncome > 1200000) tax += (Math.min(taxableIncome, 1500000) - 1200000) * 0.20;
  if (taxableIncome > 1000000) tax += (Math.min(taxableIncome, 1200000) - 1000000) * 0.15;
  if (taxableIncome > 700000)  tax += (Math.min(taxableIncome, 1000000) - 700000) * 0.10;
  if (taxableIncome > 300000)  tax += (Math.min(taxableIncome, 700000) - 300000) * 0.05;
  // 87A rebate: if income ≤ 7L, full tax rebate
  if (taxableIncome <= 700000) tax = 0;
  return Math.round(tax * 1.04); // +4% cess
}

function hraExemption(basic, hra, rentPaid, isMetro) {
  if (!rentPaid || !basic) return 0;
  const a = Number(hra) || 0;
  const b = Math.max(0, Number(rentPaid) - 0.1 * Number(basic));
  const c = Number(basic) * (isMetro ? 0.5 : 0.4);
  return Math.round(Math.min(a, b, c));
}

const INPUT = 'w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-blue-400/40 focus:outline-none';
const LABEL = 'text-xs text-gray-500 block mb-1';

function Row({ label, value, highlight }) {
  return (
    <div className={`flex justify-between items-center py-1.5 text-sm border-b border-white/5 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-gray-400">{label}</span>
      <span className={highlight ? 'text-white' : 'text-gray-200'}>{fmt(value)}</span>
    </div>
  );
}

export default function TaxSection({ tax, setTax, onSave, saveState }) {
  const [showOldDetails, setShowOldDetails] = useState(false);
  const [showNewDetails, setShowNewDetails] = useState(false);

  const income = Number(tax.grossIncome) || 0;

  // Old regime computations
  const old = useMemo(() => {
    const stdDed = 50000;
    const c80 = Math.min(150000,
      (Number(tax.ppf) || 0) + (Number(tax.elss) || 0) + (Number(tax.lic) || 0) +
      (Number(tax.nsc) || 0) + (Number(tax.hlPrincipal) || 0) + (Number(tax.tuition) || 0) +
      (Number(tax.fd5yr) || 0) + (Number(tax.epf80c) || 0) + (Number(tax.other80c) || 0)
    );
    const c80d = Math.min(25000, Number(tax.health80d) || 0) + Math.min(50000, Number(tax.parentsHealth80d) || 0);
    const nps   = Math.min(50000, Number(tax.nps80ccd) || 0);
    const hlInt = Math.min(200000, Number(tax.hlInterest) || 0);
    const hra   = hraExemption(tax.basic, tax.hraReceived, tax.rentPaid, tax.isMetro);
    const totalDed = stdDed + c80 + c80d + nps + hlInt + hra;
    const taxable  = Math.max(0, income - totalDed);
    const taxAmt   = computeOldRegimeTax(taxable);
    return { stdDed, c80, c80d, nps, hlInt, hra, totalDed, taxable, taxAmt };
  }, [tax, income]);

  // New regime computations
  const newR = useMemo(() => {
    const stdDed  = 75000; // FY25-26
    const taxable = Math.max(0, income - stdDed);
    const taxAmt  = computeNewRegimeTax(taxable);
    return { stdDed, taxable, taxAmt };
  }, [income]);

  const saving = newR.taxAmt - old.taxAmt; // positive = old regime saves money

  const f = (field, value) => setTax((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🧾</span> Tax Planning · FY 2025-26
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Compare old vs new tax regime and track deductions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 hover:bg-blue-500/25 transition-colors text-sm">
            <Save size={14} /> Save
          </button>
          {saveState.status !== 'idle' && (
            <span className={saveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{saveState.message}</span>
          )}
        </div>
      </div>

      {/* Regime comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border-2 ${saving > 0 ? 'bg-emerald-500/8 border-emerald-400/40' : 'bg-slate-900/50 border-white/10'}`}>
          <div className="text-xs text-gray-400 mb-1">Old Regime Tax</div>
          <div className={`text-2xl font-bold ${saving > 0 ? 'text-emerald-300' : 'text-gray-200'}`}>{fmt(old.taxAmt)}</div>
          <div className="text-xs text-gray-500 mt-1">Taxable: {fmt(old.taxable)}</div>
          {saving > 0 && <div className="text-xs text-emerald-400 mt-1 font-semibold">✓ Saves {fmt(saving)} vs new</div>}
        </div>
        <div className={`p-5 rounded-2xl border-2 ${saving < 0 ? 'bg-emerald-500/8 border-emerald-400/40' : 'bg-slate-900/50 border-white/10'}`}>
          <div className="text-xs text-gray-400 mb-1">New Regime Tax</div>
          <div className={`text-2xl font-bold ${saving < 0 ? 'text-emerald-300' : 'text-gray-200'}`}>{fmt(newR.taxAmt)}</div>
          <div className="text-xs text-gray-500 mt-1">Taxable: {fmt(newR.taxable)}</div>
          {saving < 0 && <div className="text-xs text-emerald-400 mt-1 font-semibold">✓ Saves {fmt(-saving)} vs old</div>}
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col justify-center">
          <div className="text-xs text-gray-400 mb-2">Recommended Regime</div>
          <div className={`text-lg font-bold ${saving === 0 ? 'text-gray-300' : saving > 0 ? 'text-emerald-300' : 'text-blue-300'}`}>
            {saving === 0 ? 'Equal' : saving > 0 ? '🏆 Old Regime' : '🏆 New Regime'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {saving === 0 ? 'Same tax either way' : `Save ${fmt(Math.abs(saving))} per year`}
          </div>
        </div>
      </div>

      {/* Income + basic */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Income Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Gross Annual Income (₹)', field: 'grossIncome' },
            { label: 'Basic Salary (₹)', field: 'basic' },
            { label: 'HRA Received (₹)', field: 'hraReceived' },
            { label: 'Annual Rent Paid (₹)', field: 'rentPaid' },
          ].map(({ label, field }) => (
            <label key={field} className="flex flex-col gap-1">
              <span className={LABEL}>{label}</span>
              <input type="number" min={0} value={tax[field] ?? 0}
                onChange={(e) => f(field, e.target.value)} className={INPUT} />
            </label>
          ))}
          <label className="flex flex-col gap-1 col-span-2 md:col-span-1">
            <span className={LABEL}>City Type</span>
            <select value={tax.isMetro ? 'metro' : 'non-metro'}
              onChange={(e) => f('isMetro', e.target.value === 'metro')}
              className={INPUT + ' bg-slate-900'}>
              <option value="metro">Metro (50% of basic)</option>
              <option value="non-metro">Non-Metro (40% of basic)</option>
            </select>
          </label>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
          <Info size={12} /> HRA exemption: min of (HRA received, rent − 10% basic, 50%/40% of basic). Computed: {fmt(old.hra)}/yr
        </div>
      </div>

      {/* 80C Investments */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">Section 80C Investments <span className="text-gray-500 font-normal">(max ₹1,50,000)</span></h3>
          <div className={`text-sm font-bold ${old.c80 >= 150000 ? 'text-green-300' : 'text-amber-300'}`}>
            {fmt(old.c80)} / {fmt(150000)}
          </div>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (old.c80 / 150000) * 100)}%` }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'PPF', field: 'ppf' }, { label: 'ELSS Mutual Funds', field: 'elss' },
            { label: 'LIC Premium', field: 'lic' }, { label: 'NSC', field: 'nsc' },
            { label: 'Home Loan Principal', field: 'hlPrincipal' }, { label: 'Tuition Fees', field: 'tuition' },
            { label: '5-Year Tax FD', field: 'fd5yr' }, { label: 'EPF (Employee)', field: 'epf80c' },
            { label: 'Other 80C', field: 'other80c' },
          ].map(({ label, field }) => (
            <label key={field} className="flex flex-col gap-1">
              <span className={LABEL}>{label}</span>
              <input type="number" min={0} value={tax[field] ?? 0}
                onChange={(e) => f(field, e.target.value)} className={INPUT} />
            </label>
          ))}
        </div>
      </div>

      {/* 80D Health Insurance */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">Section 80D · Health Insurance</h3>
          <span className="text-sm text-gray-400">{fmt(old.c80d)} claimed</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={LABEL}>Self + Family premium (max ₹25,000)</span>
            <input type="number" min={0} value={tax.health80d ?? 0}
              onChange={(e) => f('health80d', e.target.value)} className={INPUT} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={LABEL}>Parents premium (max ₹25,000 / ₹50,000 senior)</span>
            <input type="number" min={0} value={tax.parentsHealth80d ?? 0}
              onChange={(e) => f('parentsHealth80d', e.target.value)} className={INPUT} />
          </label>
        </div>
      </div>

      {/* NPS + Home Loan Interest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">80CCD(1B) · NPS <span className="text-gray-500 font-normal">(max ₹50,000)</span></h3>
          <input type="number" min={0} value={tax.nps80ccd ?? 0}
            onChange={(e) => f('nps80ccd', e.target.value)} className={INPUT} placeholder="NPS contribution beyond 80C" />
          <div className="text-xs text-gray-500">{fmt(old.nps)} deduction applied (old regime only)</div>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Section 24b · Home Loan Interest <span className="text-gray-500 font-normal">(max ₹2,00,000)</span></h3>
          <input type="number" min={0} value={tax.hlInterest ?? 0}
            onChange={(e) => f('hlInterest', e.target.value)} className={INPUT} placeholder="Annual interest paid" />
          <div className="text-xs text-gray-500">{fmt(old.hlInt)} deduction applied (old regime only)</div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
          <button type="button" onClick={() => setShowOldDetails(!showOldDetails)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 mb-3">
            Old Regime Breakdown
            <span className="text-gray-500">{showOldDetails ? '▲' : '▼'}</span>
          </button>
          {showOldDetails && (
            <div className="space-y-0.5">
              <Row label="Gross Income" value={income} />
              <Row label="Standard Deduction" value={-old.stdDed} />
              <Row label="Section 80C" value={-old.c80} />
              <Row label="Section 80D" value={-old.c80d} />
              <Row label="NPS 80CCD(1B)" value={-old.nps} />
              <Row label="Home Loan Interest 24b" value={-old.hlInt} />
              <Row label="HRA Exemption" value={-old.hra} />
              <Row label="Taxable Income" value={old.taxable} highlight />
              <Row label="Tax + Cess (4%)" value={old.taxAmt} highlight />
              <Row label="Effective Rate" value={`${income > 0 ? ((old.taxAmt / income) * 100).toFixed(1) : 0}%`} />
            </div>
          )}
          {!showOldDetails && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax payable</span>
              <span className="font-bold text-gray-200">{fmt(old.taxAmt)}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
          <button type="button" onClick={() => setShowNewDetails(!showNewDetails)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 mb-3">
            New Regime Breakdown
            <span className="text-gray-500">{showNewDetails ? '▲' : '▼'}</span>
          </button>
          {showNewDetails && (
            <div className="space-y-0.5">
              <Row label="Gross Income" value={income} />
              <Row label="Standard Deduction" value={-newR.stdDed} />
              <Row label="Taxable Income" value={newR.taxable} highlight />
              <Row label="Tax + Cess (4%)" value={newR.taxAmt} highlight />
              <Row label="Effective Rate" value={`${income > 0 ? ((newR.taxAmt / income) * 100).toFixed(1) : 0}%`} />
              <div className="pt-2 text-xs text-gray-500">No 80C/80D/HRA/NPS/HL Interest deductions in new regime</div>
            </div>
          )}
          {!showNewDetails && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax payable</span>
              <span className="font-bold text-gray-200">{fmt(newR.taxAmt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

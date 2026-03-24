'use client';
import { useState, useMemo } from 'react';
import { Save, ChevronDown, ChevronRight } from 'lucide-react';

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN')}`;
}

const BANK_TYPES   = ['Savings', 'Current', 'Salary', 'NRE', 'NRO', 'Fixed Deposit', 'PPF', 'Other'];
const CARD_TYPES   = ['Visa', 'Mastercard', 'Rupay', 'Amex', 'Diners', 'Other'];
const CARD_NETWORKS = ['Visa', 'Mastercard', 'Rupay', 'Amex', 'Diners', 'Other'];

const INPUT  = 'w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-blue-400/40 focus:outline-none';
const LABEL  = 'text-xs text-gray-500 block mb-1';

// Mask account number — show last 4 digits only
function maskAcct(num) {
  const s = String(num || '').replace(/\s/g, '');
  if (s.length <= 4) return s;
  return '••••' + s.slice(-4);
}

function UtilBar({ used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color = pct >= 75 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Utilization</span>
        <span className={pct >= 75 ? 'text-red-400' : pct >= 50 ? 'text-amber-400' : 'text-emerald-400'}>{pct}%</span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AccountsSection({ accounts, setAccounts, onSave, saveState }) {
  const [expandedBank, setExpandedBank] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  /* ── Bank helpers ─────────────────────────────────────────────────── */
  const addBank = () => setAccounts((p) => ({
    ...p,
    banks: [...(p.banks || []), {
      id: Date.now(), bankName: '', accountType: 'Savings', accountNumber: '',
      ifsc: '', branch: '', balance: 0, notes: '',
    }],
  }));
  const updBank = (id, field, val) => setAccounts((p) => ({
    ...p, banks: (p.banks || []).map((b) => b.id === id ? { ...b, [field]: val } : b),
  }));
  const remBank = (id) => setAccounts((p) => ({ ...p, banks: (p.banks || []).filter((b) => b.id !== id) }));

  /* ── Credit card helpers ──────────────────────────────────────────── */
  const addCard = () => setAccounts((p) => ({
    ...p,
    cards: [...(p.cards || []), {
      id: Date.now(), issuer: '', cardName: '', network: 'Visa', last4: '',
      creditLimit: 0, outstanding: 0, dueDate: '', annualFee: 0, rewardType: '', notes: '',
    }],
  }));
  const updCard = (id, field, val) => setAccounts((p) => ({
    ...p, cards: (p.cards || []).map((c) => c.id === id ? { ...c, [field]: val } : c),
  }));
  const remCard = (id) => setAccounts((p) => ({ ...p, cards: (p.cards || []).filter((c) => c.id !== id) }));

  /* ── Totals ───────────────────────────────────────────────────────── */
  const totals = useMemo(() => {
    const bankBalance  = (accounts.banks || []).reduce((s, b) => s + (Number(b.balance) || 0), 0);
    const cardOutstand = (accounts.cards || []).reduce((s, c) => s + (Number(c.outstanding) || 0), 0);
    const cardLimit    = (accounts.cards || []).reduce((s, c) => s + (Number(c.creditLimit) || 0), 0);
    const availCredit  = cardLimit - cardOutstand;
    return { bankBalance, cardOutstand, cardLimit, availCredit };
  }, [accounts]);

  /* ── Cards due soon ───────────────────────────────────────────────── */
  const dueSoon = useMemo(() => {
    const now  = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return (accounts.cards || [])
      .filter((c) => c.dueDate && new Date(c.dueDate) >= now && new Date(c.dueDate) <= soon)
      .map((c) => ({ ...c, daysLeft: Math.ceil((new Date(c.dueDate) - now) / 864e5) }));
  }, [accounts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🏦</span> Accounts
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">All bank and credit card accounts in one place.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={addBank}
            className="px-3 py-1.5 rounded-lg text-xs border border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/15 text-blue-300 transition-colors">
            + Bank Account
          </button>
          <button type="button" onClick={addCard}
            className="px-3 py-1.5 rounded-lg text-xs border border-violet-400/30 bg-violet-500/10 hover:bg-violet-500/15 text-violet-300 transition-colors">
            + Credit Card
          </button>
          <button type="button" onClick={onSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 hover:bg-blue-500/25 transition-colors text-sm">
            <Save size={14} /> Save
          </button>
          {saveState.status !== 'idle' && (
            <span className={saveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>
              {saveState.message}
            </span>
          )}
        </div>
      </div>

      {/* Payment due alerts */}
      {dueSoon.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-200">
          <span className="text-lg mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold">Credit card payment due soon</p>
            <p className="text-xs text-red-300 mt-0.5">
              {dueSoon.map((c) => `${c.issuer || 'Card'} ••${c.last4 || '??'} — ${fmt(c.outstanding)} due in ${c.daysLeft}d`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      {((accounts.banks || []).length > 0 || (accounts.cards || []).length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Bank Balance', value: fmt(totals.bankBalance), color: 'text-blue-300', sub: `${(accounts.banks || []).length} account${(accounts.banks||[]).length !== 1 ? 's' : ''}` },
            { label: 'Card Outstanding', value: fmt(totals.cardOutstand), color: totals.cardOutstand > 0 ? 'text-red-300' : 'text-gray-400', sub: `${(accounts.cards || []).length} card${(accounts.cards||[]).length !== 1 ? 's' : ''}` },
            { label: 'Total Credit Limit', value: fmt(totals.cardLimit), color: 'text-violet-300', sub: 'across all cards' },
            { label: 'Available Credit', value: fmt(totals.availCredit), color: totals.availCredit > 0 ? 'text-emerald-300' : 'text-red-300', sub: totals.cardLimit > 0 ? `${Math.round((totals.availCredit / totals.cardLimit) * 100)}% free` : '—' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="p-4 rounded-2xl bg-slate-900/50 border border-white/10">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bank Accounts ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-blue-300 flex items-center gap-2">
            <span>🏛</span> Bank Accounts
            {(accounts.banks || []).length > 0 && (
              <span className="text-xs text-gray-500 font-normal">({(accounts.banks || []).length})</span>
            )}
          </h3>
        </div>

        {(accounts.banks || []).length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm bg-slate-900/30 border border-white/5 rounded-2xl">
            No bank accounts added. Click &quot;+ Bank Account&quot; to add one.
          </div>
        ) : (
          <div className="space-y-3">
            {(accounts.banks || []).map((bank) => {
              const open = expandedBank === bank.id;
              return (
                <div key={bank.id} className="bg-slate-900/50 border border-blue-500/15 rounded-2xl overflow-hidden">
                  {/* Collapsed row */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedBank(open ? null : bank.id)}
                  >
                    {open ? <ChevronDown size={15} className="text-gray-500 shrink-0" /> : <ChevronRight size={15} className="text-gray-500 shrink-0" />}
                    {/* Bank logo placeholder */}
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center shrink-0 text-sm font-bold text-blue-300">
                      {(bank.bankName || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-200 truncate">{bank.bankName || 'Unnamed Bank'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 shrink-0">{bank.accountType}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {bank.accountNumber ? maskAcct(bank.accountNumber) : 'No account number'}
                        {bank.branch ? ` · ${bank.branch}` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-blue-300 text-lg">{fmt(bank.balance)}</div>
                      <div className="text-xs text-gray-600">balance</div>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); remBank(bank.id); }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-2 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded fields */}
                  {open && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'Bank Name', field: 'bankName', type: 'text', placeholder: 'e.g. HDFC Bank' },
                          { label: 'Account Type', field: 'accountType', type: 'select', options: BANK_TYPES },
                          { label: 'Account Number', field: 'accountNumber', type: 'text', placeholder: 'Full account number' },
                          { label: 'IFSC Code', field: 'ifsc', type: 'text', placeholder: 'e.g. HDFC0001234' },
                          { label: 'Branch', field: 'branch', type: 'text', placeholder: 'e.g. Andheri West' },
                          { label: 'Current Balance (₹)', field: 'balance', type: 'number' },
                        ].map(({ label, field, type, placeholder, options }) => (
                          <label key={field} className="flex flex-col gap-1">
                            <span className={LABEL}>{label}</span>
                            {type === 'select' ? (
                              <select value={bank[field]} onChange={(e) => updBank(bank.id, field, e.target.value)} className={INPUT + ' bg-slate-900'}>
                                {options.map((o) => <option key={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input type={type} value={bank[field] ?? ''} placeholder={placeholder}
                                onChange={(e) => updBank(bank.id, field, e.target.value)} className={INPUT} />
                            )}
                          </label>
                        ))}
                      </div>
                      <label className="flex flex-col gap-1">
                        <span className={LABEL}>Notes</span>
                        <input value={bank.notes || ''} onChange={(e) => updBank(bank.id, 'notes', e.target.value)}
                          placeholder="e.g. Primary salary account" className={INPUT + ' text-gray-400'} />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Credit Cards ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-violet-300 flex items-center gap-2">
            <span>💳</span> Credit Cards
            {(accounts.cards || []).length > 0 && (
              <span className="text-xs text-gray-500 font-normal">({(accounts.cards || []).length})</span>
            )}
          </h3>
        </div>

        {(accounts.cards || []).length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm bg-slate-900/30 border border-white/5 rounded-2xl">
            No credit cards added. Click &quot;+ Credit Card&quot; to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(accounts.cards || []).map((card) => {
              const open = expandedCard === card.id;
              const outstanding = Number(card.outstanding) || 0;
              const limit       = Number(card.creditLimit) || 0;
              const daysLeft    = card.dueDate
                ? Math.ceil((new Date(card.dueDate) - new Date()) / 864e5)
                : null;

              return (
                <div key={card.id} className="bg-slate-900/50 border border-violet-500/15 rounded-2xl overflow-hidden">
                  {/* Card visual header */}
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-4 pb-3 border-b border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{card.issuer || 'Bank'}</div>
                        <div className="font-semibold text-gray-200 mt-0.5">{card.cardName || 'Credit Card'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">••••{card.last4 || '????'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300">{card.network}</span>
                        <button type="button" onClick={() => setExpandedCard(open ? null : card.id)}
                          className="p-1 rounded text-gray-500 hover:text-white transition-colors">
                          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <button type="button" onClick={() => remCard(card.id)}
                          className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Balance + limit */}
                    <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                      <div>
                        <div className="text-gray-600">Outstanding</div>
                        <div className={`font-bold text-sm mt-0.5 ${outstanding > 0 ? 'text-red-300' : 'text-gray-400'}`}>{fmt(outstanding)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Limit</div>
                        <div className="font-bold text-sm mt-0.5 text-gray-300">{limit ? fmt(limit) : '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Due date</div>
                        <div className={`font-bold text-sm mt-0.5 ${daysLeft !== null && daysLeft <= 7 ? 'text-red-300' : daysLeft !== null && daysLeft <= 14 ? 'text-amber-300' : 'text-gray-300'}`}>
                          {daysLeft === null ? '—' : daysLeft < 0 ? 'Overdue' : `${daysLeft}d`}
                        </div>
                      </div>
                    </div>

                    {/* Utilization bar */}
                    {limit > 0 && <UtilBar used={outstanding} limit={limit} />}
                  </div>

                  {/* Expanded fields */}
                  {open && (
                    <div className="px-5 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Bank / Issuer', field: 'issuer', type: 'text', placeholder: 'e.g. HDFC Bank' },
                          { label: 'Card Name', field: 'cardName', type: 'text', placeholder: 'e.g. Regalia' },
                          { label: 'Network', field: 'network', type: 'select', options: CARD_NETWORKS },
                          { label: 'Last 4 Digits', field: 'last4', type: 'text', placeholder: '1234', maxLength: 4 },
                          { label: 'Credit Limit (₹)', field: 'creditLimit', type: 'number' },
                          { label: 'Current Outstanding (₹)', field: 'outstanding', type: 'number' },
                          { label: 'Payment Due Date', field: 'dueDate', type: 'date' },
                          { label: 'Annual Fee (₹)', field: 'annualFee', type: 'number' },
                          { label: 'Reward Type', field: 'rewardType', type: 'text', placeholder: 'e.g. Cashback, Points' },
                        ].map(({ label, field, type, placeholder, options, maxLength }) => (
                          <label key={field} className="flex flex-col gap-1">
                            <span className={LABEL}>{label}</span>
                            {type === 'select' ? (
                              <select value={card[field]} onChange={(e) => updCard(card.id, field, e.target.value)} className={INPUT + ' bg-slate-900'}>
                                {options.map((o) => <option key={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input type={type} value={card[field] ?? ''} placeholder={placeholder} maxLength={maxLength}
                                onChange={(e) => updCard(card.id, field, e.target.value)} className={INPUT + (type === 'date' ? ' text-gray-300' : '')} />
                            )}
                          </label>
                        ))}
                      </div>
                      <label className="flex flex-col gap-1">
                        <span className={LABEL}>Notes</span>
                        <input value={card.notes || ''} onChange={(e) => updCard(card.id, 'notes', e.target.value)}
                          placeholder="e.g. 5x rewards on dining" className={INPUT + ' text-gray-400'} />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
